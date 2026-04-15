import { Router } from 'express';
import { PublicFeedbackController } from '../controllers/public-feedback.controller';
import { PublicPassengerController } from '../controllers/public-passenger.controller';
import { PublicVehicleController } from '../controllers/public-vehicle.controller';
import { feedbackUpload } from '../middlewares/feedback-upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/vehicle/:publicAccessId', asyncHandler(PublicVehicleController.getVehiclePublicState));
router.post('/join-request', asyncHandler(PublicPassengerController.createJoinRequest));
router.post('/feedback/:qrToken', feedbackUpload.single('media'), asyncHandler(PublicFeedbackController.createByQrToken));

export default router;
