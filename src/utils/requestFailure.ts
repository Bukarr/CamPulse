export function isNetworkLikeFailure(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return /failed to fetch|network|offline|load failed|socket hang up|econnrefused|timeout|aborted/i.test(message);
  }

  if (typeof error === 'string') {
    return /failed to fetch|network|offline|load failed|socket hang up|econnrefused|timeout|aborted/i.test(error.toLowerCase());
  }

  return false;
}

export function shouldQueueOfflineAction(error: unknown, responseStatus?: number, serverMessage?: string): boolean {
  if (typeof responseStatus === 'number' && responseStatus >= 400 && responseStatus < 600) {
    return false;
  }

  if (typeof serverMessage === 'string') {
    const normalized = serverMessage.toLowerCase();
    if (normalized.includes('guard') || normalized.includes('denied') || normalized.includes('forbidden') || normalized.includes('unauthorized') || normalized.includes('required') || normalized.includes('not found') || normalized.includes('invalid') || normalized.includes('server')) {
      return false;
    }
  }

  return isNetworkLikeFailure(error);
}
