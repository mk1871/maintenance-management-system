import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

// Mock de Supabase - definir antes del vi.mock para evitar el error de inicialización
const mockSignIn = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/services/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: mockSignIn,
        getUser: mockGetUser,
      },
    },
  }
})

// Crear un router de prueba
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
  ],
})

// Tipo para el componente LoginForm
interface LoginFormComponent {
  default: unknown
}

describe('US-001: Login', () => {
  let LoginForm: unknown

  beforeEach(async () => {
    // Importar el componente después de hacer el mock
    const module: LoginFormComponent = await import('./LoginForm.vue')
    LoginForm = module.default

    vi.clearAllMocks()
    // Asegurarse de que el router esté listo para cada test
    router.push('/login')
    await router.isReady()
  })

  it('debe autenticar usuario con credenciales válidas', async () => {
    // Mock de éxito de login
    mockSignIn.mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })

    const wrapper = mount(LoginForm, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
          router,
        ],
      },
    })

    // Rellenar credenciales
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')

    // Hacer clic en login
    await wrapper.find('button[type="submit"]').trigger('click')

    // Verificar que se llamó a la función de login
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })

    // Verificar que se cambió el estado de loading
    await vi.waitFor(() => {
      const vm = wrapper.vm as unknown
      expect(vm.isLoading).toBe(false)
    })
  })

  it('debe mostrar error con credenciales inválidas', async () => {
    // Mock de error de login
    const mockError = { error: { message: 'Invalid login credentials' } }
    mockSignIn.mockResolvedValue(mockError)

    const wrapper = mount(LoginForm, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
          router,
        ],
      },
    })

    // Rellenar credenciales
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('wrongpassword')

    // Hacer clic en login
    await wrapper.find('button[type="submit"]').trigger('click')

    // Verificar que se llamó a la función de login
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    // Verificar que se mostró el mensaje de error
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Email o password incorrect')
    })
  })

  it('debe validar campos de entrada', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
          router,
        ],
      },
    })

    // Campo de email inválido
    await wrapper.find('input[type="email"]').setValue('invalid-email')
    await wrapper.find('input[type="email"]').trigger('blur')

    // Verificar mensaje de error
    expect(wrapper.text()).toContain('Formato de email inválido')

    // Campo de contraseña vacío
    await wrapper.find('input[type="password"]').setValue('')
    await wrapper.find('input[type="password"]').trigger('blur')

    // Verificar mensaje de error
    expect(wrapper.text()).toContain('Contraseña requerida')
  })
})
