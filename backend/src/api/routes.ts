import { Router } from 'express';
import { getStageDescription, uploadBinaryHandler, deleteBinaryHandler, runHandler, stopHandler } from './controllers';


const router = Router();

router.get('/:number', getStageDescription);

router.route('/:number/binary')
    .post(uploadBinaryHandler)
    .delete(deleteBinaryHandler)


router.get('/:number/run', runHandler)

router.get('/:number/stop', stopHandler)

export default router;