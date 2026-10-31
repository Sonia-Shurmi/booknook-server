
const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const allowedCategories = [
  "Fiction",
  "Novels",
  "Science",
  "History",
  "Kids",
  "Others",
];

// Get all books (Public)
router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const limit = Number(req.query.limit);

    let query = db
      .collection("books")
      .find()
      .sort({ addedAt: -1 });

    if (Number.isInteger(limit) && limit > 0) {
      query = query.limit(Math.min(limit, 100));
    }

    const books = await query.toArray();

    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

// Get a single book (Private)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const db = req.app.locals.db;

    const book = await db.collection("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch book" });
  }
});

// Add a new book (Private)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      typeof image !== "string" ||
      !image.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !allowedCategories.includes(category)
    ) {
      return res.status(400).json({
        message: "Please provide valid book information",
      });
    }

    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        message: "Total copies must be at least 1",
      });
    }

    const db = req.app.locals.db;

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      category,
      image: image.trim(),
      description: description.trim(),
      addedByName: req.user.name || req.user.email,
      addedByEmail: req.user.email.toLowerCase(),
      totalCopies: copies,
      availableCopies: copies,
      addedAt: new Date(),
    };

    const result = await db.collection("books").insertOne(newBook);

    res.status(201).json({
      message: "Book added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add book" });
  }
});

// Update a book (Owner only)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      typeof image !== "string" ||
      !image.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !allowedCategories.includes(category)
    ) {
      return res.status(400).json({
        message: "Please provide valid book information",
      });
    }

    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        message: "Total copies must be at least 1",
      });
    }

    const db = req.app.locals.db;
    const booksCollection = db.collection("books");

    const bookId = new ObjectId(id);
    const ownerEmail = req.user.email.toLowerCase();

    const existingBook = await booksCollection.findOne({
      _id: bookId,
      addedByEmail: ownerEmail,
    });

    if (!existingBook) {
      return res.status(404).json({
        message: "Book not found or you are not its owner",
      });
    }

    const borrowedCopies =
      existingBook.totalCopies - existingBook.availableCopies;

    if (copies < borrowedCopies) {
      return res.status(400).json({
        message:
          "Total copies cannot be less than currently borrowed copies",
      });
    }

    const result = await booksCollection.updateOne(
      {
        _id: bookId,
        addedByEmail: ownerEmail,
        totalCopies: existingBook.totalCopies,
        availableCopies: existingBook.availableCopies,
      },
      {
        $set: {
          title: title.trim(),
          author: author.trim(),
          category,
          image: image.trim(),
          description: description.trim(),
          totalCopies: copies,
          availableCopies: copies - borrowedCopies,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(409).json({
        message: "Book changed during update. Please try again.",
      });
    }

    res.status(200).json({
      message: "Book updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update book" });
  }
});

// Delete a book (Owner only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const db = req.app.locals.db;
    const bookId = new ObjectId(id);
    const ownerEmail = req.user.email.toLowerCase();

    const book = await db.collection("books").findOne({
      _id: bookId,
      addedByEmail: ownerEmail,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found or you are not its owner",
      });
    }

    const activeBorrow = await db.collection("borrows").findOne({
      bookId: bookId,
      status: "active",
    });

    if (activeBorrow) {
      return res.status(409).json({
        message: "Cannot delete a book while it has active borrows",
      });
    }

    const result = await db.collection("books").deleteOne({
      _id: bookId,
      addedByEmail: ownerEmail,
      availableCopies: book.availableCopies,
    });

    if (result.deletedCount === 0) {
      return res.status(409).json({
        message: "Book changed during deletion. Please try again.",
      });
    }

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete book" });
  }
});

module.exports = router;
