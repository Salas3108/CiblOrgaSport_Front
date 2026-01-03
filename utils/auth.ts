export function logout(redirectTo: string = "/login") {
  try {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  } finally {
    // Use location to ensure a full reload and state reset
    window.location.href = redirectTo
  }
}
