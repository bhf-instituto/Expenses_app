import SET_ROLE from "../constants/setRoles.js";

export const checkExpenseAccess = ({
  allowOwner = false,
  allowAdmin = false
} = {}) => {
  return (req, res, next) => {

    const isOwner = req.expense?.isOwner;
    const alreadyDeleted = req.expense?.alreadyDeleted === true;
    const role = req.set?.role;

    const isAdmin = Number(role) === SET_ROLE.ADMIN;

    if (alreadyDeleted) {
      return next();
    }

    if (
      (allowOwner && isOwner) ||
      (allowAdmin && isAdmin)
    ) {
      return next();
    }

    return res.status(403).json({
      ok: false,
      data: { message: 'not allowed to modify this expense' }
    });
  };
};