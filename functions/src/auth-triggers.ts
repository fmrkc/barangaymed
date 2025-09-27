import { beforeUserCreated } from "firebase-functions/v2/identity";
import { logger } from "firebase-functions";

export const setroleonusercreate = beforeUserCreated((event) => {
  const user = event.data;

  if (!user) {
    logger.error("User data is undefined in beforeUserCreated event, cannot set claims.");
    return;
  }

  const customClaims = {
    role: 'user',
    verificationStatus: 'not_submitted',
  };

  logger.log(`Setting default claims for new user ${user.uid}:`, customClaims);

  return {
    customClaims: customClaims,
  };
});
