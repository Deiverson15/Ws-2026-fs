import {Router} from 'express';
import {register, getList,update, activate} from '../controllers/accounts.controller.js' 

const router = Router();

router.post('/', register);
router.get('/list', getList);
router.put('/:id', update);
router.put('/:id/activate', activate)

export default router;



