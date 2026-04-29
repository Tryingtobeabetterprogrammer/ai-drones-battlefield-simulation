import { create } from "zustand";

export const useSwarm = create((set) => ({
  drones: [],
  updateDrone: (id, position, isAI, trust) =>
    set((state) => {
      // Find and replace or add new
      const index = state.drones.findIndex(d => d.id === id);
      const newDrone = { id, position: [...position], isAI, trust };
      
      if (index === -1) {
        return { drones: [...state.drones, newDrone] };
      } else {
        const newDrones = [...state.drones];
        newDrones[index] = newDrone;
        return { drones: newDrones };
      }
    }),
  removeDrone: (id) =>
    set((state) => ({
      drones: state.drones.filter(d => d.id !== id)
    })),
  clearSwarm: () => set({ drones: [] })
}));
