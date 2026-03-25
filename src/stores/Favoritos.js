import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "./Auth";

export const useFavoritosStore = defineStore("favoritos", () => {
  const auth = useAuthStore();
  
  // Guardamos favoritos por usuario: { "id_user": ["id_lectura1", "id_lectura2"] }
  const favsByUser = ref({});
  
  const currentUserId = computed(() => auth.usuario?._id || 'guest');

  // Helper interno para migrar el JSON viejo progresivamente
  const migrarDatosAntiguos = () => {
    const key = `ml_fav_${currentUserId.value}`;
    const dataLocal = localStorage.getItem(key);
    
    // Si hay datos en el fallback y Pinia aún no los asimiló
    if (dataLocal && !favsByUser.value[currentUserId.value]) {
       try {
         const parsed = JSON.parse(dataLocal);
         if (Array.isArray(parsed)) {
            favsByUser.value[currentUserId.value] = parsed;
         }
       } catch (e) {
         console.warn("Fallo al migrar localStorage de favoritos:", e);
       }
    }
  };

  const lecturasFavoritasIds = computed(() => {
    migrarDatosAntiguos();
    return favsByUser.value[currentUserId.value] || [];
  });

  const esFav = (id) => lecturasFavoritasIds.value.includes(id);

  const toggleFav = (id) => {
    migrarDatosAntiguos();
    
    if (!favsByUser.value[currentUserId.value]) {
       favsByUser.value[currentUserId.value] = [];
    }

    const arr = favsByUser.value[currentUserId.value];
    if (arr.includes(id)) {
      favsByUser.value[currentUserId.value] = arr.filter(f => f !== id);
    } else {
      favsByUser.value[currentUserId.value].push(id);
    }
    
    // Mantenemos fallback temporal hacia localStorage según el requerimiento del usuario
    localStorage.setItem(`ml_fav_${currentUserId.value}`, JSON.stringify(favsByUser.value[currentUserId.value]));
  };

  return {
    favsByUser,
    lecturasFavoritasIds,
    esFav,
    toggleFav
  };
}, { persist: true });
