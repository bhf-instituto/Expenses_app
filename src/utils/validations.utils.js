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

const normString = (string) => string.toLowerCase().trim();



function validateEmail(email_) {
    email = normString(email_);

    if (email.length > 127) return false;

    if (!BASE_EMAIL_REGEX.test(email)) return false;

    const [localPart, domain] = email.split("@");

    if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.length < 6) return false;

    if (localPart.includes("..")) return false;

    if (!ALLOWED_DOMAINS.has(domain)) return false;

    return true;
}


export { validateEmail, normString }