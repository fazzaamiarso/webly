import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, { successRedirect: "/shop" });
  return null;
};

export const action = async ({ request }: ActionArgs) => {
  return await authenticator.authenticate("user-pass", request, {
    successRedirect: "/",
  });
};

export default function Signup() {
  return (
    <main className="w-screen min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto rounded-md  space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-4xl">Sign up to Webly</h2>
          <p>
            or{" "}
            <Link to="/signin" className="text-blue-500">
              sign in here
            </Link>
          </p>
        </div>
        <Form
          method="post"
          className="space-y-6 ring-1 p-8 rounded-md ring-black w-full"
        >
          <input type="text" hidden name="auth-type" defaultValue="signup" />
          <div className="">
            <label htmlFor="email">Email address</label>
            <input
              type="text"
              id="email"
              name="email"
              className="w-full block rounded-md"
            />
          </div>
          <div className="">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full block rounded-md"
            />
          </div>
          <button className="w-full bg-black text-white p-2 rounded-md">
            Sign up
          </button>
        </Form>
      </div>
    </main>
  );
}
