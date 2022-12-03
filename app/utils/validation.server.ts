export const validateEmail = (email: string) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format!";
  }
};

export const validatePassword = (password: string) => {
  const PASSWORD_MIN_LENGTH = 6;
  if (password.length < PASSWORD_MIN_LENGTH) return "Password must be at least 6 characters!";
};
