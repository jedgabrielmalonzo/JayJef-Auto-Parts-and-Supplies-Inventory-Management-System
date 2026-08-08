import { Router } from 'express';
import * as usersController from '../controllers/usersController.js';

const router = Router();

router.get('/', usersController.listUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);

export default router;
