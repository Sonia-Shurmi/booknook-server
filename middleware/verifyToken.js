
const AUTH_URL = process.env.AUTH_URL || "http://localhost:3000";

// Load jose using dynamic import because it is an ES Module
let joseConfigPromise;

const getJoseConfig = () => {
  if (!joseConfigPromise) {
    joseConfigPromise = import("jose").then(
      ({ jwtVerify, createRemoteJWKSet }) => ({
        jwtVerify,
        JWKS: createRemoteJWKSet(
          new URL(`${AUTH_URL}/api/auth/jwks`)
        ),
      })
    );
  }

  return joseConfigPromise;
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    const { jwtVerify, JWKS } = await getJoseConfig();

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: AUTH_URL,
      audience: AUTH_URL,
    });

    if (!payload.sub || !payload.email) {
      return res.status(401).json({
        message: "Unauthorized: Invalid token payload",
      });
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token",
    });
  }
};

module.exports = verifyToken;
