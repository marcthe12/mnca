import api from "./api.js";

export const  config = await api("/config")()
export default config