import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { sessionStorage } from "./session.server";
import bcrypt from "bcrypt";
import invariant from "tiny-invariant";
import { prisma } from "~/lib/prisma.server";
import { json } from "@remix-run/node";

export const authenticator = new Authenticator<{
  userId: string;
  email: string;
}>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email");
    const password = form.get("password");
    const authType = form.get("auth-type");

    invariant(typeof email === "string", "Email must be string!");
    invariant(typeof password === "string", "Password can't be empty!");
    invariant(typeof authType === "string", "auth-type can't be empty!");
    invariant(
      authType === "signin" || authType === "signup",
      "auth-type can't be empty!"
    );

    let user: {
      userId: string;
      email: string;
    } = { email: "", userId: "" };

    if (authType === "signup") {
      const isUserExist = await findUser(email);
      if (isUserExist) throw json({ message: "user already exist!" }, 400);
      const newUser = await createUser(email, password);
      user = { email: newUser.email, userId: newUser.id };
    }

    if (authType === "signin") {
      const foundUser = await findUser(email);
      if (!foundUser) throw json({ message: "User not found!" }, 404);

      const hashedPassword = await prisma.password.findUnique({
        where: { userId: foundUser?.id },
        select: { hash: true },
      });

      const isValid = bcrypt.compare(hashedPassword?.hash ?? "", password);
      if (!isValid) throw json({ message: "Unauthorized!" }, 401);

      user = { email: foundUser.email, userId: foundUser.id };
    }

    return user;
  }),
  "user-pass"
);

export const findUser = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const createUser = async (email: string, password: string) => {
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: { hash },
      },
    },
  });
  return user;
};
