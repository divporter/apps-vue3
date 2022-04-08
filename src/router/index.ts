import { createRouter, createWebHistory } from "vue-router"
import ViewOne from "@/views/ViewOne.vue"
import ViewTwo from "@/views/ViewTwo.vue"

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: "/one",
      name: "one",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: ViewOne,
    },
    {
      path: "/two",
      name: "two",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: ViewTwo,
    },
  ],
})

export default router
