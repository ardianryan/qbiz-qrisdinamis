import { eq, inArray } from "drizzle-orm";
import { db, queryClient } from "../db/db.ts";
import { users } from "../db/schema.ts";
import { hashPassword } from "../src/middleware/auth.ts";

interface CliOptions {
  role: "SUPER_ADMIN" | "ADMIN";
  email?: string;
  newEmail?: string;
  password?: string;
  useDefault: boolean;
  list: boolean;
  listAll: boolean;
  help: boolean;
}

const DEFAULTS = {
  SUPER_ADMIN: {
    id: "usr_superadmin",
    name: "Super Admin",
    email: "superadmin@qbiz.com",
    password: "SuperQBiz2026",
  },
  ADMIN: {
    id: "usr_admin",
    name: "Admin Operations",
    email: "admin@qbiz.com",
    password: "AdminQBiz2026",
  },
} as const;

function printHelp() {
  console.log(`
QBiz Admin Account & Password Reset CLI
=======================================

Usage:
  deno task admin:reset [options]

Options:
  --list                       List all SUPER_ADMIN & ADMIN accounts (ID, Role, Email)
  --list-all                   List all user accounts in the database
  --role=<SUPER_ADMIN|ADMIN>   Target built-in role (default: SUPER_ADMIN)
  --email=<current_email>      Target specific user by current email
  --new-email=<new_email>      Update the target user's email address
  --password=<new_password>    Set explicit password (min 8 characters)
  --default                    Restore built-in default password
  -h, --help                   Show this help message

Examples:
  # Check registered Super Admin & Admin emails
  deno task admin:reset --list

  # Reset Super Admin with a newly generated secure random password
  deno task admin:reset

  # Reset Super Admin password AND change its email
  deno task admin:reset --new-email=boss@toko.com --password="NewStrongPassword2026!"

  # Reset Admin Operations to a custom password
  deno task admin:reset --role=ADMIN --password="NewAdminPassword2026!"

  # Restore built-in default Super Admin password
  deno task admin:reset --default

  # Reset & rename any user by current email
  deno task admin:reset --email=lama@toko.com --new-email=baru@toko.com --password="NewPassword2026!"
`);
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    role: "SUPER_ADMIN",
    useDefault: false,
    list: false,
    listAll: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      opts.help = true;
    } else if (arg === "--default") {
      opts.useDefault = true;
    } else if (arg === "--list") {
      opts.list = true;
    } else if (arg === "--list-all") {
      opts.listAll = true;
    } else if (arg.startsWith("--role=")) {
      const val = arg.slice("--role=".length).trim().toUpperCase();
      if (val !== "SUPER_ADMIN" && val !== "ADMIN") {
        throw new Error(`Invalid --role "${val}". Allowed values: SUPER_ADMIN, ADMIN.`);
      }
      opts.role = val;
    } else if (arg.startsWith("--email=")) {
      opts.email = arg.slice("--email=".length).trim().toLowerCase();
    } else if (arg.startsWith("--new-email=")) {
      opts.newEmail = arg.slice("--new-email=".length).trim().toLowerCase();
    } else if (arg.startsWith("--password=")) {
      opts.password = arg.slice("--password=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}. Use --help for usage.`);
    }
  }

  return opts;
}

function generateSecurePassword(length = 16): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
}

async function listUsers(includeAll: boolean) {
  const rows = includeAll
    ? await db.select().from(users)
    : await db.select().from(users).where(inArray(users.role, ["SUPER_ADMIN", "ADMIN"]));

  if (rows.length === 0) {
    console.log(includeAll ? "No users found in database." : "No SUPER_ADMIN or ADMIN users found.");
    return;
  }

  console.table(
    rows.map((u) => ({
      id: u.id,
      role: u.role,
      name: u.name,
      email: u.email,
      merchantId: u.merchantId || "-",
    }))
  );
}

async function main() {
  let opts: CliOptions;
  try {
    opts = parseArgs(Deno.args);
  } catch (err) {
    console.error(`[Error] ${(err as Error).message}`);
    Deno.exit(1);
  }

  if (opts.help) {
    printHelp();
    return;
  }

  if (opts.list || opts.listAll) {
    await listUsers(opts.listAll);
    return;
  }

  if (opts.newEmail !== undefined && !opts.newEmail.includes("@")) {
    console.error("[Error] Invalid --new-email format.");
    Deno.exit(1);
  }

  const preset = DEFAULTS[opts.role];

  let newPassword: string;
  if (opts.password !== undefined) {
    if (opts.password.length < 8) {
      console.error("[Error] Password must be at least 8 characters long.");
      Deno.exit(1);
    }
    newPassword = opts.password;
  } else if (opts.useDefault) {
    newPassword = preset.password;
  } else {
    newPassword = generateSecurePassword(16);
  }

  const passwordHash = await hashPassword(newPassword);

  // Locate target user:
  // 1. If --email is provided, match exact email.
  // 2. Otherwise, match built-in ID (usr_superadmin / usr_admin), then fallback to first user with that role.
  let existing = opts.email
    ? await db.select().from(users).where(eq(users.email, opts.email))
    : await db.select().from(users).where(eq(users.id, preset.id));

  if (!opts.email && existing.length === 0) {
    existing = await db.select().from(users).where(eq(users.role, opts.role));
  }

  if (existing.length > 0) {
    const target = existing[0];
    const finalEmail = opts.newEmail || target.email;

    if (opts.newEmail && opts.newEmail !== target.email) {
      const conflict = await db.select().from(users).where(eq(users.email, opts.newEmail));
      if (conflict.length > 0 && conflict[0].id !== target.id) {
        console.error(`[Error] Email "${opts.newEmail}" is already used by user ${conflict[0].id}.`);
        Deno.exit(1);
      }
    }

    await db
      .update(users)
      .set({
        email: finalEmail,
        password: passwordHash,
      })
      .where(eq(users.id, target.id));

    console.log("========================================");
    console.log(" QBiz Admin Account Reset Successful");
    console.log("========================================");
    console.log(` User ID  : ${target.id}`);
    console.log(` Role     : ${target.role}`);
    console.log(` Email    : ${finalEmail}`);
    console.log(` Password : ${newPassword}`);
    console.log("========================================");
    return;
  }

  if (opts.email && opts.email !== preset.email) {
    console.error(`[Error] User with email "${opts.email}" was not found in database.`);
    Deno.exit(1);
  }

  // Re-create built-in admin account if it was deleted or missing
  const createEmail = opts.newEmail || preset.email;
  await db.insert(users).values({
    id: preset.id,
    name: preset.name,
    email: createEmail,
    password: passwordHash,
    role: opts.role,
    merchantId: null,
  });

  console.log("========================================");
  console.log(" QBiz Built-in Admin Recreated & Reset");
  console.log("========================================");
  console.log(` User ID  : ${preset.id}`);
  console.log(` Role     : ${opts.role}`);
  console.log(` Email    : ${createEmail}`);
  console.log(` Password : ${newPassword}`);
  console.log("========================================");
}

try {
  await main();
} finally {
  await queryClient.end();
}
