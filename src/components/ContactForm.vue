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
  <section id="contact" class="contact-section" v-reveal>
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
.contact-section {
  background: var(--color-surface);
}
h2 {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 2.5vw, 2.5rem);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 16px;
}
.desc {
  font-family: var(--font-serif);
  font-size: var(--font-size-xl);
  line-height: 1.6;
  margin: 0 0 40px;
  color: var(--color-muted);
}
.form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 800px;
}
label {
  display: grid;
  gap: 10px;
}
label span {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.01em;
}
.error {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #dc2626;
  margin-top: -4px;
}
input,
textarea {
  font-family: var(--font-serif);
  font-size: var(--font-size-lg);
  border: 2px solid rgba(0, 0, 0, 0.08);
  background: var(--color-bg-alt);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  color: inherit;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
input::placeholder,
textarea::placeholder {
  color: color-mix(in srgb, var(--color-muted) 70%, transparent);
}
input:hover,
textarea:hover {
  border-color: rgba(0, 0, 0, 0.12);
}
input:focus-visible,
textarea:focus-visible {
  outline: none;
  border-color: var(--color-primary-600);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-600) 12%, transparent);
}
input[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: #dc2626;
  background: color-mix(in srgb, #dc2626 4%, var(--color-bg-alt));
}
input[aria-invalid='true']:focus-visible,
textarea[aria-invalid='true']:focus-visible {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px color-mix(in srgb, #dc2626 12%, transparent);
}
textarea {
  resize: vertical;
  min-height: 140px;
  line-height: 1.6;
}
.full {
  grid-column: 1 / -1;
}
.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.submit {
  background: linear-gradient(
    180deg,
    var(--color-primary-600),
    color-mix(in srgb, var(--color-primary-600) 85%, black 5%)
  );
  color: var(--color-surface);
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  font-weight: 600;
  border: none;
  padding: 16px 32px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(126, 87, 194, 0.2);
}
.submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.submit:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(126, 87, 194, 0.3);
}
.submit:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--color-primary-600) 20%, transparent),
    0 8px 20px rgba(126, 87, 194, 0.3);
}
@media (max-width: 700px) {
  .form {
    grid-template-columns: 1fr;
  }

  h2 {
    font-size: var(--font-size-3xl);
  }

  input,
  textarea {
    font-size: var(--font-size-base);
    padding: 14px 16px;
  }

  .submit {
    font-size: var(--font-size-base);
    padding: 14px 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  input,
  textarea,
  .submit {
    transition: none;
  }
}
</style>
