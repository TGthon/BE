import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import HTTPError from '../../utils/HTTPError';

const router = Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());


export default router;