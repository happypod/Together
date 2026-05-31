import assert from "node:assert/strict";
import { AuthorizationError, hasPermission, type AuthUser } from "@/domain/auth/permissions";
import { USER_ROLES } from "@/domain/definitions";
import {
  createPreviewUserManagementView,
  createUser,
  deactivateUser,
  updateUserRole,
} from "@/server/users/user-management-service";

const superAdmin: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  role: "SUPER_ADMIN",
  isActive: true,
};
const anchorAdmin: AuthUser = {
  id: "00000000-0000-4000-8000-000000000002",
  role: "ANCHOR_ADMIN",
  isActive: true,
};
const viewer: AuthUser = {
  id: "00000000-0000-4000-8000-000000000006",
  role: "VIEWER",
  isActive: true,
};

assert.equal(hasPermission(superAdmin, "user:manage"), true);
assert.equal(hasPermission(anchorAdmin, "user:manage"), true);
assert.equal(hasPermission(viewer, "user:manage"), false);

const superView = createPreviewUserManagementView(superAdmin);
assert.deepEqual(
  superView.roleOptions.map((role) => role.value),
  USER_ROLES,
);
assert.equal(superView.users.find((user) => user.role === "SUPER_ADMIN")?.canDeactivate, false);
assert.equal(superView.users.find((user) => user.role === "COUNCIL_OPERATOR")?.canChangeRole, true);

const anchorView = createPreviewUserManagementView(anchorAdmin);
assert.deepEqual(
  anchorView.roleOptions.map((role) => role.value),
  ["COUNCIL_OPERATOR", "LINKER", "TAXI_PARTNER", "VIEWER"],
);
assert.equal(anchorView.users.find((user) => user.role === "SUPER_ADMIN")?.canChangeRole, false);
assert.equal(anchorView.users.find((user) => user.role === "ANCHOR_ADMIN")?.canDeactivate, false);
assert.equal(anchorView.users.find((user) => user.role === "COUNCIL_OPERATOR")?.canChangeRole, true);

void (async () => {
  await createUser(anchorAdmin, {
    name: "권한 테스트",
    email: "role-test@example.org",
    role: "SUPER_ADMIN",
    reason: "권한 검증",
  }).then(
    () => assert.fail("ANCHOR_ADMIN must not assign SUPER_ADMIN"),
    (error) => assert.equal(error instanceof AuthorizationError, true),
  );

  await createUser(viewer, {
    name: "권한 테스트",
    email: "viewer-test@example.org",
    role: "VIEWER",
    reason: "권한 검증",
  }).then(
    () => assert.fail("VIEWER must not create users"),
    (error) => assert.equal(error instanceof AuthorizationError, true),
  );

  await updateUserRole(superAdmin, {
    userId: superAdmin.id,
    role: "ANCHOR_ADMIN",
    reason: "자기 역할 변경 검증",
    confirmed: true,
  }).then(
    () => assert.fail("self role change must be blocked"),
    (error) => assert.match(error.message, /본인 역할/),
  );

  await deactivateUser(superAdmin, {
    userId: superAdmin.id,
    reason: "자기 비활성화 검증",
    confirmed: true,
  }).then(
    () => assert.fail("self deactivation must be blocked"),
    (error) => assert.match(error.message, /본인 계정/),
  );

  await updateUserRole(anchorAdmin, {
    userId: "00000000-0000-4000-8000-000000000003",
    role: "VIEWER",
    reason: "확인 누락 검증",
    confirmed: false,
  }).then(
    () => assert.fail("role change confirmation must be required"),
    (error) => assert.match(error.message, /확인/),
  );

  console.log("user-management-ok");
})();
