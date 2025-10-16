import { apiCall, unwrapApiEnvelope, type ApiEnvelope } from "./base";
import type {
  LoginPayload,
  LoginResponse,
  SessionResponse,
} from "../modules/auth/types";

export const AuthApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiCall<ApiEnvelope<LoginResponse>>(
      "/usuario/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return unwrapApiEnvelope(response);
  },

  async logout(): Promise<void> {
    await apiCall("/usuario/logout", { method: "POST", skipJson: true });
  },

  async currentSession(): Promise<SessionResponse> {
    const response = await apiCall<ApiEnvelope<SessionResponse>>("/usuario/me");
    return unwrapApiEnvelope(response);
  },
};
