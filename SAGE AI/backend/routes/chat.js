/* routes/chat.js */
import { Router } from 'express';
import { sendMessage, getHistory, getSession } from '../controllers/chatController.js';

const router = Router();
router.post('/',                sendMessage);
router.get('/history',          getHistory);
router.get('/session/:sessionId', getSession);
export default router;
