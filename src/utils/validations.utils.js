import EXPENSE_TYPE from "../constants/expenseTypes.constant.js";

const BASE_EMAIL_REGEX =
    /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ALLOWED_DOMAINS = new Set([
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "yahoo.com",
    "icloud.com"
]);

const normString = (str, length = 5) => {
    if(str == null) return false;
    
    const normalized = str
        .trim()
        .replace(/\s+/g, ' ');

    if ((normalized.match(/ /g) || []).length > 3) {
        return false;
    }
    if (normalized.length < length) return false;
    return normalized.toLowerCase();
};

function validatePhone(phone) {
    if (typeof phone !== 'string' && typeof phone !== 'number') return false;

    const str = String(phone);

    const regex = /^(2224\d{6}|11\d{8})$/;

    if (!regex.test(str)) return false;

    return phone;
}


function validateEmail(email_) {

    const email = normString(email_);

    if (email.length > 127) return false;

    if (!BASE_EMAIL_REGEX.test(email)) return false;

    const [localPart, domain] = email.split("@");

    if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.length < 6) return false;

    if (localPart.includes("..")) return false;

    if (!ALLOWED_DOMAINS.has(domain)) return false;

    return email_;
}

function validateInt(value) {
    const number = Number(value);
    if (Number.isInteger(number) && number >= 0) return number;

    return null;
}

function validateExpenseType(value_) {
    let value = Number(value_)

    if (!Object.values(EXPENSE_TYPE).includes(value)) {
        return undefined;
    }
    return value;
}

export { validateEmail, validatePhone, normString, validateInt, validateExpenseType }