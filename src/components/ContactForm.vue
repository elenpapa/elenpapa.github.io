<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { content, type ContactContent } from '@/services/content'

const data = ref<ContactContent | null>(null)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')

onMounted(async () => {
  data.value = await content.getContact()
})

// Validation schema
const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
  }),
)

const { handleSubmit, errors, meta } = useForm({
  validationSchema: schema,
})

const { value: name } = useField<string>('name')
const { value: email } = useField<string>('email')
const { value: message } = useField<string>('message')

const onSubmit = handleSubmit(async (values) => {
  try {
    // Create mailto link with form data
    const mailtoLink = `mailto:${data.value?.mailto}?subject=Contact from ${encodeURIComponent(values.name)}&body=${encodeURIComponent(values.message)}%0D%0A%0D%0AFrom: ${encodeURIComponent(values.email)}`

    globalThis.location.href = mailtoLink
    submitStatus.value = 'success'

    // Reset form after short delay
    setTimeout(() => {
      submitStatus.value = 'idle'
    }, 3000)
  } catch (error) {
    submitStatus.value = 'error'
    console.error('Form submission error:', error)
  }
})

const submitButtonText = computed(() => {
  if (submitStatus.value === 'success') return '✓ Sent!'
  if (submitStatus.value === 'error') return '✗ Error'
  return data.value?.submit.label || 'Submit'
})
</script>

<template>
  <section id="contact" v-reveal>
    <div class="container">
      <h2>{{ data?.title }}</h2>
      <p class="desc">{{ data?.description }}</p>
      <form class="form" @submit="onSubmit" novalidate>
        <label>
          <span>{{ data?.fields.name.label }}</span>
          <input
            type="text"
            v-model="name"
            :placeholder="data?.fields.name.placeholder"
            :aria-invalid="!!errors.name"
            :aria-describedby="errors.name ? 'name-error' : undefined"
            required
          />
          <span v-if="errors.name" id="name-error" class="error" role="alert">
            {{ errors.name }}
          </span>
        </label>

        <label>
          <span>{{ data?.fields.email.label }}</span>
          <input
            type="email"
            v-model="email"
            :placeholder="data?.fields.email.placeholder"
            :aria-invalid="!!errors.email"
            :aria-describedby="errors.email ? 'email-error' : undefined"
            required
          />
          <span v-if="errors.email" id="email-error" class="error" role="alert">
            {{ errors.email }}
          </span>
        </label>

        <label class="full">
          <span>{{ data?.fields.message.label }}</span>
          <textarea
            v-model="message"
            :placeholder="data?.fields.message.placeholder"
            rows="5"
            :aria-invalid="!!errors.message"
            :aria-describedby="errors.message ? 'message-error' : undefined"
            required
          />
          <span v-if="errors.message" id="message-error" class="error" role="alert">
            {{ errors.message }}
          </span>
        </label>

        <div class="actions">
          <button
            class="submit"
            type="submit"
            :disabled="!meta.valid || submitStatus === 'success'"
            :aria-busy="submitStatus === 'success'"
          >
            {{ submitButtonText }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
h2 {
  font-family: var(--font-serif);
  font-size: var(--font-size-3xl);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 12px;
}
.desc {
  font-family: var(--font-serif);
  font-size: var(--font-size-lg);
  line-height: 1.6;
  margin: 0 0 28px;
  color: var(--color-muted);
}
.form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
label {
  display: grid;
  gap: 8px;
}
label span {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.error {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #dc2626;
  text-transform: none;
  letter-spacing: normal;
  margin-top: -4px;
}
input,
textarea {
  font-family: var(--font-serif);
  font-size: var(--font-size-base);
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  color: inherit;
  transition: all 0.2s ease;
}
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-primary-600);
  border-color: transparent;
}
input[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: #dc2626;
}
input[aria-invalid='true']:focus-visible,
textarea[aria-invalid='true']:focus-visible {
  outline-color: #dc2626;
}
.full {
  grid-column: 1 / -1;
}
.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}
.submit {
  background: var(--color-primary);
  color: #1a1433;
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  font-weight: 600;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.submit:not(:disabled):hover,
.submit:focus-visible {
  background: var(--color-primary-600);
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}
@media (max-width: 700px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
