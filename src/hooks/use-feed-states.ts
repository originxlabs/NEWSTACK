import { INDIAN_STATES_CONFIG } from "@/lib/india-states-config";

// Helper to get state name from state_id
export function getStateName(stateId: string | null): string {
  if (!stateId) return "All India";
  const state = INDIAN_STATES_CONFIG.find(s => s.id === stateId);
  return state?.name || stateId;
}

// Get state config by ID
export function getStateConfig(stateId: string | null) {
  if (!stateId) return null;
  return INDIAN_STATES_CONFIG.find(s => s.id === stateId) || null;
}

// Get all states for dropdown
export function getStatesForDropdown() {
  return [
    { id: "", name: "All India", code: "IN" },
    ...INDIAN_STATES_CONFIG.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
    })),
  ];
}

// Get state color class
export function getStateColor(stateId: string | null): string {
  const state = INDIAN_STATES_CONFIG.find(s => s.id === stateId);
  return state?.color || "bg-primary";
}
