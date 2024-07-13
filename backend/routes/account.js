const express = require("express");
const { Account } = require("../db");
const { authMiddleware } = require("../middleware");
const { default: mongoose } = require("mongoose");

const router = express.Router();

router.get('/balance', authMiddleware, async (req, res) => {
    try {
        console.log("UserId from token:", req.userId);

        const account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            console.log("Account not found for userId:", req.userId);
            return res.status(404).json({
                message: "Account not found"
            });
        }

        console.log("Account found:", account);
        res.json({
            balance: account.balance
        });
    } catch (error) {
        console.error("Error fetching account:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

router.post('/transfer', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();

    try {
        const { amount, to } = req.body;
        console.log("Transfer request from userId:", req.userId, "to userId:", to, "amount:", amount);

        const account = await Account.findOne({ userId: req.userId }).session(session);

        if (!account || account.balance < amount) {
            console.log("Insufficient funds or account not found for userId:", req.userId);
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient funds"
            });
        }

        const toAccount = await Account.findOne({ userId: to }).session(session);
        if (!toAccount) {
            console.log("Invalid recipient userId:", to);
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid recipient"
            });
        }

        await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
        await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

        await session.commitTransaction();
        console.log("Transfer successful from userId:", req.userId, "to userId:", to, "amount:", amount);
        res.json({
            message: "Transfer successful"
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error during transfer:", error);
        res.status(500).json({
            message: "Server error"
        });
    } finally {
        session.endSession();
    }
});

module.exports = router;
