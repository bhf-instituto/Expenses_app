import { validateEmail } from '../utils/validations.utils.js';
import bcrypt from 'bcryptjs';

const test_01 = (email) => {
    console.log("asasdasd" + validateEmail(email));
}

test_01("aaaaaa@gmail.com");


const hashSomething = () =>  bcrypt.hashSync("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJtaXJrb18wQGdtYWlsLmNvbSIsImlhdCI6MTc2ODM0OTk3NiwiZXhwIjoxNzY4OTU0Nzc2fQ.bq_gF6ZmLf1bLQ2ATNJfHddnlhV9pBAwF-X1VkzyF_U", 10)



export {test_01, hashSomething}