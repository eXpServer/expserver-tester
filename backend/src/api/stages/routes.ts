import { Router } from 'express';
import multer from 'multer';
import { getStageDescription, uploadBinaryHandler, deleteBinaryHandler, runHandler, stopHandler } from './stageHandler/controllers';


const router = Router();
const upload = multer({ dest: 'uploads' });

router.get('/:num', getStageDescription);

router.route('/:num/binary')
    .post(upload.single('binary'), uploadBinaryHandler)
    .delete(deleteBinaryHandler)


router.get('/:num/run', runHandler)

router.get('/:num/stop', stopHandler)

export default router;