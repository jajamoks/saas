import { StatusCodes } from 'http-status-codes';
import joi, { Schema } from 'joi';
import _ from 'lodash';
import { ErrorNames } from '../../constants';
import { ServiceError } from '../../errors/service-error';
import { CustomContext } from '../../types';
import { useApiAction } from '../utils/api-action';
import { config } from '../../utils/environment';

type ProvisionBody = {
  idToken: string;
};

export const schema: Schema = joi.object({
  idToken: joi.string().required(),
});

const parsePicture = (provider: string, picture: string | undefined) => {
  if (!picture) return;

  switch (provider) {
    case 'Facebook':
      return JSON.parse(picture).data.url;
    default:
      return picture;
  }
};

export const action = useApiAction(async (ctx: CustomContext) => {
  const {
    request: { body },
    dependencies: {
      services: { authenticationService, userService },
    },
  } = ctx;
  const { idToken } = <ProvisionBody>body;

  const tokenPayload = await authenticationService.verifyIdToken({ token: idToken });
  const identityId = await authenticationService.getIdentityId({ token: idToken });

  const { given_name: givenName, family_name: familyName, email, picture, sub, identities } = tokenPayload;
  if (!email || !sub) {
    throw new ServiceError({
      name: ErrorNames.MISSING_PROPERTY_ERROR,
      message: 'Missing required user property',
      statusCode: StatusCodes.EXPECTATION_FAILED,
    });
  }

  const primaryIdentity = identities?.find((val) => val.primary === 'true');

  const user = {
    sub: sub.toString(),
    identityId,
    firstName: givenName?.toString() || _.upperFirst(config.name),
    lastName: familyName?.toString() || 'User',
    email: email.toString(),
    picture: primaryIdentity ? parsePicture(primaryIdentity.providerName, picture?.toString()) : null,
  };

  const me = await userService.provision(user);

  return {
    body: {
      me,
    },
  };
});
