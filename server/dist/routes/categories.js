"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRouter = void 0;
const express_1 = require("express");
const categories_1 = require("../services/categories");
const router = (0, express_1.Router)();
exports.categoryRouter = router;
router.get('/', (_req, res) => {
    res.json(categories_1.CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
    })));
});
