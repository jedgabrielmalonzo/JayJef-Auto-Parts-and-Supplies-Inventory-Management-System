import { Router } from 'express';
import * as shopSettingsController from '../controllers/shopSettingsController.js';

const router = Router();

router.get('/', shopSettingsController.getSettings);
router.put('/', shopSettingsController.updateSettings);

export default router;
