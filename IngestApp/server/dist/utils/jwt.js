"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyToken = verifyToken;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, {
        // Typescript is overly strict here; runtime is fine with string like "15m"
        expiresIn: env_1.env.jwtExpiresIn,
    });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, {
        expiresIn: env_1.env.jwtRefreshExpiresIn,
    });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
}
