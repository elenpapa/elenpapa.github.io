// Composable for loading content with loading states
import { useAsyncState } from '@vueuse/core'
import { content } from '@/services/content'
import type {
  SiteContent,
  HomeContent,
  TimelineContent,
  ServicesContent,
  PostsContent,
  ContactContent,
} from '@/services/content'

export function useSiteContent() {
  const { state, isLoading, error, isReady } = useAsyncState(content.getSite, null, {
    immediate: true,
    resetOnExecute: false,
  })

  return {
    site: state as typeof state & { value: SiteContent | null },
    isLoading,
    error,
    isReady,
  }
}

export function useHomeContent() {
  const { state, isLoading, error, isReady } = useAsyncState(content.getHome, null, {
    immediate: true,
    resetOnExecute: false,
  })

  return {
    home: state as typeof state & { value: HomeContent | null },
    isLoading,
    error,
    isReady,
  }
}

export function useTimelineContent() {
  const { state, isLoading, error, isReady } = useAsyncState(content.getTimeline, null, {
    immediate: true,
    resetOnExecute: false,
  })

  return {
    timeline: state as typeof state & { value: TimelineContent | null },
    isLoading,
    error,
    isReady,
  }
}

export function useServicesContent() {
  const { state, isLoading, error, isReady } = useAsyncState(content.getServices, null, {
    immediate: true,
    resetOnExecute: false,
  })

  return {
    services: state as typeof state & { value: ServicesContent | null },
    isLoading,
    error,
    isReady,
  }
}

export function usePostsContent() {
  const { state, isLoading, error, isReady } = useAsyncState(content.getPosts, null, {
    immediate: true,
    resetOnExecute: false,
  })

  return {
    posts: state as typeof state & { value: PostsContent | null },
    isLoading,
    error,
    isReady,
  }
}

export function useContactContent() {
  const { state, isLoading, error, isReady } = useAsyncState(content.getContact, null, {
    immediate: true,
    resetOnExecute: false,
  })

  return {
    contact: state as typeof state & { value: ContactContent | null },
    isLoading,
    error,
    isReady,
  }
}
