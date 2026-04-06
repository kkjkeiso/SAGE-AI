/* routes/content.js */
import { Router } from 'express';
import { listContent, addContent, removeContent } from '../controllers/contentController.js';

const router = Router();
router.get('/',       listContent);
router.post('/',      addContent);
router.delete('/:id', removeContent);
export default router;
