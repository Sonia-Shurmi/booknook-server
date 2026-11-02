
const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Borrow a book (Authenticated users only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { bookId, returnDate } = req.body;

    if (!bookId || !ObjectId.isValid(bookId) || !returnDate) {
      return res.status(400).json({
        message: "Please provide a valid book ID and return date",
      });
    }

    const parsedReturnDate = new Date(returnDate);

    if (
      Number.isNaN(parsedReturnDate.getTime()) ||
      parsedReturnDate <= new Date()
    ) {
      return res.status(400).json({
        message: "Please provide a valid future return date",
      });
    }

    const db = req.app.locals.db;
    const booksCollection = db.collection("books");
    const borrowsCollection = db.collection("borrows");

    const userEmail = req.user.email.toLowerCase();
    const userName = req.user.name || userEmail;
    const bookObjectId = new ObjectId(bookId);

    // Check whether the book exists
    const book = await booksCollection.findOne({
      _id: bookObjectId,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    // Decrease stock atomically
    const stockUpdate = await booksCollection.updateOne(
      {
        _id: bookObjectId,
        availableCopies: { $gt: 0 },
      },
      {
        $inc: { availableCopies: -1 },
      }
    );

    if (stockUpdate.modifiedCount === 0) {
      return res.status(409).json({
        message: "This book is currently unavailable",
      });
    }

    const borrowRecord = {
      bookId: bookObjectId,
      bookTitle: book.title,
      bookImage: book.image,
      userName,
      userEmail,
      borrowDate: new Date(),
      returnDate: parsedReturnDate,
      status: "active",
    };

    try {
      const result = await borrowsCollection.insertOne(borrowRecord);

      return res.status(201).json({
        message: "Book borrowed successfully",
        borrowId: result.insertedId,
      });
    } catch (insertError) {
      // Restore stock if saving the borrow fails
      await booksCollection.updateOne(
        { _id: bookObjectId },
        { $inc: { availableCopies: 1 } }
      );

      // Handle duplicate active borrow
      if (insertError.code === 11000) {
        return res.status(409).json({
          message: "You have already borrowed this book",
        });
      }

      throw insertError;
    }
  } catch (error) {
    console.error("Borrow error:", error);

    return res.status(500).json({
      message: "Failed to borrow book",
    });
  }
});

// Get current user's borrowed books
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userEmail = req.user.email.toLowerCase();

    const borrows = await db
      .collection("borrows")
      .find({
        userEmail,
        status: "active",
      })
      .sort({ borrowDate: -1 })
      .toArray();

    return res.status(200).json(borrows);
  } catch (error) {
    console.error("Fetch borrows error:", error);

    return res.status(500).json({
      message: "Failed to fetch borrowed books",
    });
  }
});

// Return a borrowed book (Owner only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid borrow ID",
      });
    }

    const db = req.app.locals.db;
    const borrowsCollection = db.collection("borrows");
    const booksCollection = db.collection("books");

    const borrowId = new ObjectId(id);
    const userEmail = req.user.email.toLowerCase();

    const borrow = await borrowsCollection.findOne({
      _id: borrowId,
      userEmail,
      status: "active",
    });

    if (!borrow) {
      return res.status(404).json({
        message: "Active borrow record not found",
      });
    }

    const returnResult = await borrowsCollection.updateOne(
      {
        _id: borrowId,
        userEmail,
        status: "active",
      },
      {
        $set: {
          status: "returned",
          returnedAt: new Date(),
        },
      }
    );

    if (returnResult.modifiedCount === 0) {
      return res.status(409).json({
        message: "This book has already been returned",
      });
    }

    await booksCollection.updateOne(
      { _id: borrow.bookId },
      { $inc: { availableCopies: 1 } }
    );

    return res.status(200).json({
      message: "Book returned successfully",
    });
  } catch (error) {
    console.error("Return error:", error);

    return res.status(500).json({
      message: "Failed to return book",
    });
  }
});

module.exports = router;
