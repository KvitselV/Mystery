"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MenuController_1 = require("../controllers/MenuController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Публичное чтение меню (без авторизации для гостей/кафе)
router.get('/categories', MenuController_1.MenuController.getAllCategoriesWithItems);
router.get('/categories/list', MenuController_1.MenuController.getAllCategories);
router.get('/categories/:id', MenuController_1.MenuController.getCategoryById);
router.get('/items/popular', MenuController_1.MenuController.getPopularItems);
router.get('/items', MenuController_1.MenuController.getAllItems);
router.get('/items/:id', MenuController_1.MenuController.getItemById);
// Запись — только с авторизацией и ролью ADMIN
router.use(authMiddleware_1.authMiddleware);
router.post('/categories', (0, authMiddleware_2.requireRole)(['ADMIN']), MenuController_1.MenuController.createCategory);
router.patch('/categories/:id', (0, authMiddleware_2.requireRole)(['ADMIN']), MenuController_1.MenuController.updateCategory);
router.delete('/categories/:id', (0, authMiddleware_2.requireRole)(['ADMIN']), MenuController_1.MenuController.deleteCategory);
router.post('/items', (0, authMiddleware_2.requireRole)(['ADMIN']), MenuController_1.MenuController.createItem);
router.patch('/items/:id', (0, authMiddleware_2.requireRole)(['ADMIN']), MenuController_1.MenuController.updateItem);
router.delete('/items/:id', (0, authMiddleware_2.requireRole)(['ADMIN']), MenuController_1.MenuController.deleteItem);
exports.default = router;
//# sourceMappingURL=menu.js.map