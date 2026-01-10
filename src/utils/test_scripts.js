import { validateEmail } from '../utils/validations.utils.js';

const test_01 = (email) => {
    console.log(validateEmail(email));
}

test_01("aaaaaa@gmail.com");

export {test_01}