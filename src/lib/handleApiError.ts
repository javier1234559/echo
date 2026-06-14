export const handleApiError = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { message?: string } } })
      .response;
    const apiMessage = res?.data?.message;
    const fallback =
      error instanceof Error ? error.message : "An error occurred";
    throw new Error(apiMessage ?? fallback);
  }
  throw new Error(error instanceof Error ? error.message : "An error occurred");
};
