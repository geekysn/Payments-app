const express = require("express");
const zod = require('zod');
const { User } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const router = express.Router();
const { authMiddleware } = require("../middleware");

const signupSchema = zod.object({
    username: zod.string().email(),
    password: zod.string().min(6),
    firstName: zod.string(),
    lastName: zod.string(),
});

router.post('/signup', async (req, res) => {
    const body = req.body;
    const result = signupSchema.safeParse(body);

    if (!result.success) {
        return res.status(400).json({
            message: "Incorrect Inputs",
        });
    }

    const existingUser = await User.findOne({
        username: body.username,
    });

    if (existingUser) {
        return res.status(400).json({
            message: "Email already exists",
        });
    }

    const newUser = await User.create({
        username: body.username,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
    });

    const token = jwt.sign({
        userId: newUser._id,
    }, JWT_SECRET);

    res.json({
        message: "User Created Successfully",
        token,
    });
});

const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string(),
});

router.post("/signin", async (req, res) => {
    const body = req.body;
    const result = signinSchema.safeParse(body);

    if (!result.success) {
        return res.status(400).json({
            message: "Incorrect Inputs",
        });
    }

    const user = await User.findOne({
        username: body.username,
        password: body.password,
    });

    if (user) {
        const token = jwt.sign({
            userId: user._id,
        }, JWT_SECRET);

        res.json({
            message: "User Signed In Successfully",
            token,
        });
    } else {
        res.status(400).json({
            message: "Incorrect Inputs",
        });
    }
});

const updateSchema = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
});

router.put("/", authMiddleware, async (req, res) => {
    const result = updateSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Error while updating information",
        });
    }

    await User.updateOne({ _id: req.userId }, req.body);

    res.json({
        message: "Updated successfully",
    });
});

router.get('/bulk', async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [
            { firstName: { "$regex": filter, "$options": "i" } },
            { lastName: { "$regex": filter, "$options": "i" } },
        ],
    });

    res.json({
        users: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id,
        })),
    });
});

module.exports = router;
