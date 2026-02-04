// ============================================
// Sonner Toast Library - React Toast Notifications
// ============================================

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useLayoutEffect, 
  useCallback,
  forwardRef,
  isValidElement 
} from 'react';

// ============================================
// Constants
// ============================================

const TOAST_LIMIT = 20;
const VISIBLE_TOASTS_AMOUNT = 3;
const DEFAULT_OFFSET = "24px";
const MOBILE_OFFSET = "16px";
const DEFAULT_DURATION = 4000;
const TOAST_WIDTH = 356;
const GAP = 14;
const SWIPE_THRESHOLD = 45;
const REMOVE_DELAY = 200;

// ============================================
// Icons
// ============================================

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" height="20" width="20">
    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ICONS = {
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
  error: <ErrorIcon />
};

// ============================================
// Loading Spinner Component
// ============================================

const LoadingBar = ({ index }) => (
  <div 
    className="sonner-loading-bar" 
    key={`spinner-bar-${index}`}
    style={{
      animationDelay: `${-1.2 + index * 0.1}s`,
      transform: `rotate(${index * 30}deg) translate(146%)`
    }}
  />
);

const LoadingSpinner = ({ visible, className }) => {
  const bars = Array(12).fill(0);
  
  return (
    <div 
      className={["sonner-loading-wrapper", className].filter(Boolean).join(" ")}
      data-visible={visible}
    >
      <div className="sonner-spinner">
        {bars.map((_, index) => (
          <LoadingBar key={index} index={index} />
        ))}
      </div>
    </div>
  );
};

// ============================================
// Utility Functions
// ============================================

const getIcon = (type) => {
  switch (type) {
    case 'success': return ICONS.success;
    case 'info': return ICONS.info;
    case 'warning': return ICONS.warning;
    case 'error': return ICONS.error;
    default: return null;
  }
};

const useDocumentVisibility = () => {
  const [isHidden, setIsHidden] = useState(document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isHidden;
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getPositionStyles = (offset, mobileOffset) => {
  const styles = {};
  
  [offset, mobileOffset].forEach((value, index) => {
    const prefix = index === 1 ? '--mobile-offset' : '--offset';
    const defaultValue = index === 1 ? MOBILE_OFFSET : DEFAULT_OFFSET;

    const applyOffset = (val) => {
      ['top', 'right', 'bottom', 'left'].forEach(side => {
        styles[`${prefix}-${side}`] = typeof val === 'number' ? `${val}px` : val;
      });
    };

    if (typeof value === 'number' || typeof value === 'string') {
      applyOffset(value);
    } else if (typeof value === 'object') {
      ['top', 'right', 'bottom', 'left'].forEach(side => {
        if (value[side] === undefined) {
          styles[`${prefix}-${side}`] = defaultValue;
        } else {
          styles[`${prefix}-${side}`] = typeof value[side] === 'number' 
            ? `${value[side]}px` 
            : value[side];
        }
      });
    } else {
      applyOffset(defaultValue);
    }
  });

  return styles;
};

const getDefaultDir = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'ltr';
  }
  
  const dir = document.documentElement.getAttribute('dir');
  
  if (dir === 'auto' || !dir) {
    return window.getComputedStyle(document.documentElement).direction;
  }
  
  return dir;
};

// ============================================
// Toast State Management
// ============================================

let toastIdCounter = 1;

class ToastState {
  constructor() {
    this.subscribers = [];
    this.toasts = [];
    this.dismissedToasts = new Set();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      this.subscribers.splice(index, 1);
    };
  }

  publish(data) {
    this.subscribers.forEach(callback => callback(data));
  }

  addToast(toast) {
    this.publish(toast);
    this.toasts = [...this.toasts, toast];
  }

  create(options) {
    const { message, ...rest } = options;
    
    const id = (typeof options?.id === 'number' || options?.id?.length > 0) 
      ? options.id 
      : toastIdCounter++;
    
    const existingToast = this.toasts.find(t => t.id === id);
    const dismissible = options.dismissible === undefined ? true : options.dismissible;

    if (this.dismissedToasts.has(id)) {
      this.dismissedToasts.delete(id);
    }

    if (existingToast) {
      this.toasts = this.toasts.map(t => 
        t.id === id 
          ? { ...t, ...options, id, title: message, dismissible }
          : t
      );
      this.publish({ ...existingToast, ...options, id, title: message });
    } else {
      this.addToast({ title: message, ...rest, dismissible, id });
    }

    return id;
  }

  dismiss(id) {
    if (id) {
      this.dismissedToasts.add(id);
      requestAnimationFrame(() => {
        this.subscribers.forEach(callback => 
          callback({ id, dismiss: true })
        );
      });
    } else {
      this.toasts.forEach(toast => {
        this.subscribers.forEach(callback => 
          callback({ id: toast.id, dismiss: true })
        );
      });
    }
    return id;
  }

  message(message, options) {
    return this.create({ ...options, message });
  }

  error(message, options) {
    return this.create({ ...options, message, type: 'error' });
  }

  success(message, options) {
    return this.create({ ...options, type: 'success', message });
  }

  info(message, options) {
    return this.create({ ...options, type: 'info', message });
  }

  warning(message, options) {
    return this.create({ ...options, type: 'warning', message });
  }

  loading(message, options) {
    return this.create({ ...options, type: 'loading', message });
  }

  promise(promise, options) {
    if (!options) return;

    let toastId;
    
    if (options.loading !== undefined) {
      toastId = this.create({
        ...options,
        promise,
        type: 'loading',
        message: options.loading,
        description: typeof options.description !== 'function' ? options.description : undefined
      });
    }

    const promiseResult = Promise.resolve(
      promise instanceof Function ? promise() : promise
    );

    let shouldUpdateToast = toastId !== undefined;
    let promiseState;

    const handleResolve = async (value) => {
      promiseState = ['resolve', value];

      if (isValidElement(value)) {
        shouldUpdateToast = false;
        this.create({ id: toastId, type: 'default', message: value });
      } else if (isResponseObject(value) && !value.ok) {
        shouldUpdateToast = false;
        const errorMessage = typeof options.error === 'function' 
          ? await options.error(`HTTP error! status: ${value.status}`)
          : options.error;
        const description = typeof options.description === 'function'
          ? await options.description(`HTTP error! status: ${value.status}`)
          : options.description;
        const messageObj = typeof errorMessage === 'object' && !isValidElement(errorMessage)
          ? errorMessage
          : { message: errorMessage };
        
        this.create({
          id: toastId,
          type: 'error',
          description,
          ...messageObj
        });
      } else if (value instanceof Error) {
        shouldUpdateToast = false;
        const errorMessage = typeof options.error === 'function'
          ? await options.error(value)
          : options.error;
        const description = typeof options.description === 'function'
          ? await options.description(value)
          : options.description;
        const messageObj = typeof errorMessage === 'object' && !isValidElement(errorMessage)
          ? errorMessage
          : { message: errorMessage };
        
        this.create({
          id: toastId,
          type: 'error',
          description,
          ...messageObj
        });
      } else if (options.success !== undefined) {
        shouldUpdateToast = false;
        const successMessage = typeof options.success === 'function'
          ? await options.success(value)
          : options.success;
        const description = typeof options.description === 'function'
          ? await options.description(value)
          : options.description;
        const messageObj = typeof successMessage === 'object' && !isValidElement(successMessage)
          ? successMessage
          : { message: successMessage };
        
        this.create({
          id: toastId,
          type: 'success',
          description,
          ...messageObj
        });
      }
    };

    const handleReject = async (error) => {
      promiseState = ['reject', error];
      
      if (options.error !== undefined) {
        shouldUpdateToast = false;
        const errorMessage = typeof options.error === 'function'
          ? await options.error(error)
          : options.error;
        const description = typeof options.description === 'function'
          ? await options.description(error)
          : options.description;
        const messageObj = typeof errorMessage === 'object' && !isValidElement(errorMessage)
          ? errorMessage
          : { message: errorMessage };
        
        this.create({
          id: toastId,
          type: 'error',
          description,
          ...messageObj
        });
      }
    };

    const handleFinally = () => {
      if (shouldUpdateToast) {
        this.dismiss(toastId);
        toastId = undefined;
      }
      options.finally?.();
    };

    const unwrap = () => new Promise((resolve, reject) => {
      promiseResult
        .then(() => promiseState[0] === 'reject' ? reject(promiseState[1]) : resolve(promiseState[1]))
        .catch(reject);
    });

    promiseResult
      .then(handleResolve)
      .catch(handleReject)
      .finally(handleFinally);

    if (typeof toastId !== 'string' && typeof toastId !== 'number') {
      return { unwrap };
    }

    return Object.assign(toastId, { unwrap });
  }

  custom(jsx, options) {
    const id = options?.id || toastIdCounter++;
    this.create({ jsx: jsx(id), id, ...options });
    return id;
  }

  getActiveToasts() {
    return this.toasts.filter(toast => !this.dismissedToasts.has(toast.id));
  }
}

const isResponseObject = (value) => {
  return value && 
         typeof value === 'object' && 
         'ok' in value && 
         typeof value.ok === 'boolean' &&
         'status' in value &&
         typeof value.status === 'number';
};

// ============================================
// Toast Instance
// ============================================

const toastState = new ToastState();

const toast = (message, options) => {
  const id = options?.id || toastIdCounter++;
  toastState.addToast({ title: message, ...options, id });
  return id;
};

const getHistory = () => toastState.toasts;
const getToasts = () => toastState.getActiveToasts();

const toastAPI = Object.assign(toast, {
  success: toastState.success.bind(toastState),
  info: toastState.info.bind(toastState),
  warning: toastState.warning.bind(toastState),
  error: toastState.error.bind(toastState),
  custom: toastState.custom.bind(toastState),
  message: toastState.message.bind(toastState),
  promise: toastState.promise.bind(toastState),
  dismiss: toastState.dismiss.bind(toastState),
  loading: toastState.loading.bind(toastState),
  getHistory,
  getToasts
});

// ============================================
// Toast Component
// ============================================

const Toast = ({
  invert,
  toast: toastData,
  unstyled,
  interacting,
  setHeights,
  visibleToasts,
  heights,
  index,
  toasts,
  expanded,
  removeToast,
  defaultRichColors,
  closeButton: defaultCloseButton,
  style,
  cancelButtonStyle,
  actionButtonStyle,
  className = "",
  descriptionClassName = "",
  duration: defaultDuration,
  position,
  gap,
  expandByDefault,
  classNames,
  icons,
  closeButtonAriaLabel = "Close toast",
  swipeDirections
}) => {
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeOutDirection, setSwipeOutDirection] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [swipeOut, setSwipeOut] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const [initialHeight, setInitialHeight] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);
  
  const durationRef = useRef(toastData.duration || defaultDuration || DEFAULT_DURATION);
  const toastRef = useRef(null);
  const pointerStartTime = useRef(null);
  const pointerStartPos = useRef(null);
  
  const isFront = index === 0;
  const isVisible = index + 1 <= visibleToasts;
  const type = toastData.type;
  const dismissible = toastData.dismissible !== false;
  const toastClassName = toastData.className || "";
  const toastDescriptionClassName = toastData.descriptionClassName || "";
  
  const toastIndex = useMemo(() => 
    heights.findIndex(h => h.toastId === toastData.id) || 0,
    [heights, toastData.id]
  );
  
  const actualCloseButton = useMemo(() => 
    toastData.closeButton ?? defaultCloseButton,
    [toastData.closeButton, defaultCloseButton]
  );
  
  const actualDuration = useMemo(() => 
    toastData.duration || defaultDuration || DEFAULT_DURATION,
    [toastData.duration, defaultDuration]
  );
  
  const pauseStartTime = useRef(0);
  const remainingTime = useRef(0);
  const lastPointerDownTime = useRef(0);
  const swipeStartPos = useRef(null);
  
  const isDocumentHidden = useDocumentVisibility();
  const invertColors = toastData.invert || invert;
  const isLoading = type === 'loading';
  
  const offsetBefore = useMemo(() => 
    heights.reduce((acc, height, i) => i >= toastIndex ? acc : acc + height.height, 0),
    [heights, toastIndex]
  );
  
  const [yPosition, xPosition] = position.split('-');

  useEffect(() => {
    durationRef.current = actualDuration;
  }, [actualDuration]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const toastElement = toastRef.current;
    if (!toastElement) return;

    const height = toastElement.getBoundingClientRect().height;
    setCurrentHeight(height);
    
    setHeights(prev => [
      { toastId: toastData.id, height, position: toastData.position },
      ...prev
    ]);

    return () => {
      setHeights(prev => prev.filter(h => h.toastId !== toastData.id));
    };
  }, [setHeights, toastData.id]);

  useLayoutEffect(() => {
    if (!mounted) return;

    const toastElement = toastRef.current;
    const originalHeight = toastElement.style.height;
    toastElement.style.height = 'auto';
    
    const newHeight = toastElement.getBoundingClientRect().height;
    toastElement.style.height = originalHeight;
    
    setCurrentHeight(newHeight);
    
    setHeights(prev => {
      const existing = prev.find(h => h.toastId === toastData.id);
      if (existing) {
        return prev.map(h => 
          h.toastId === toastData.id ? { ...h, height: newHeight } : h
        );
      }
      return [{ toastId: toastData.id, height: newHeight, position: toastData.position }, ...prev];
    });
  }, [mounted, toastData.title, toastData.description, setHeights, toastData.id, toastData.jsx, toastData.action, toastData.cancel]);

  const handleRemove = useCallback(() => {
    setRemoved(true);
    setInitialHeight(offsetBefore + toastIndex * gap);
    
    setHeights(prev => prev.filter(h => h.toastId !== toastData.id));
    
    setTimeout(() => {
      removeToast(toastData);
    }, REMOVE_DELAY);
  }, [toastData, removeToast, setHeights, offsetBefore, toastIndex, gap]);

  useEffect(() => {
    if (toastData.promise && type === 'loading' || toastData.duration === Infinity || toastData.type === 'loading') {
      return;
    }

    let timeoutId;

    if (expanded || interacting || isDocumentHidden) {
      if (remainingTime.current < pauseStartTime.current) {
        const elapsed = new Date().getTime() - pauseStartTime.current;
        durationRef.current = durationRef.current - elapsed;
      }
      remainingTime.current = new Date().getTime();
    } else if (durationRef.current !== Infinity) {
      pauseStartTime.current = new Date().getTime();
      timeoutId = setTimeout(() => {
        toastData.onAutoClose?.(toastData);
        handleRemove();
      }, durationRef.current);
    }

    return () => clearTimeout(timeoutId);
  }, [expanded, interacting, toastData, type, isDocumentHidden, handleRemove]);

  useEffect(() => {
    if (toastData.delete) {
      handleRemove();
      toastData.onDismiss?.(toastData);
    }
  }, [toastData.delete, handleRemove, toastData]);

  const renderLoader = () => {
    if (icons?.loading) {
      return (
        <div 
          className={cn(classNames?.loader, toastData.classNames?.loader, "sonner-loader")}
          data-visible={type === 'loading'}
        >
          {icons.loading}
        </div>
      );
    }
    return <LoadingSpinner className={cn(classNames?.loader, toastData.classNames?.loader)} visible={type === 'loading'} />;
  };

  const icon = toastData.icon || icons?.[type] || getIcon(type);

  return (
    <li
      tabIndex={0}
      ref={toastRef}
      className={cn(
        className,
        toastClassName,
        classNames?.toast,
        toastData.classNames?.toast,
        classNames?.default,
        classNames?.[type],
        toastData.classNames?.[type]
      )}
      data-sonner-toast=""
      data-rich-colors={toastData.richColors ?? defaultRichColors}
      data-styled={!(toastData.jsx || toastData.unstyled || unstyled)}
      data-mounted={mounted}
      data-promise={!!toastData.promise}
      data-swiped={swiped}
      data-removed={removed}
      data-visible={isVisible}
      data-y-position={yPosition}
      data-x-position={xPosition}
      data-index={index}
      data-front={isFront}
      data-swiping={swiping}
      data-dismissible={dismissible}
      data-type={type}
      data-invert={invertColors}
      data-swipe-out={swipeOut}
      data-swipe-direction={swipeOutDirection}
      data-expanded={!!(expanded || expandByDefault && mounted)}
      data-testid={toastData.testId}
      style={{
        '--index': index,
        '--toasts-before': index,
        '--z-index': toasts.length - index,
        '--offset': `${removed ? initialHeight : offsetBefore + toastIndex * gap}px`,
        '--initial-height': expandByDefault ? 'auto' : `${currentHeight}px`,
        ...style,
        ...toastData.style
      }}
      onDragEnd={() => {
        setSwiping(false);
        setSwipeDirection(null);
        swipeStartPos.current = null;
      }}
      onPointerDown={(e) => {
        if (e.button !== 2) return;
        if (isLoading || !dismissible) return;
        
        pointerStartTime.current = new Date();
        setInitialHeight(offsetBefore + toastIndex * gap);
        
        if (e.target.tagName !== 'BUTTON') {
          setSwiping(true);
          swipeStartPos.current = { x: e.clientX, y: e.clientY };
        }
        
        e.target.setPointerCapture(e.pointerId);
      }}
      onPointerUp={() => {
        if (swipeOut || !dismissible) return;
        
        swipeStartPos.current = null;
        
        const swipeAmountX = Number(toastRef.current?.style.getPropertyValue('--swipe-amount-x').replace('px', '') || 0);
        const swipeAmountY = Number(toastRef.current?.style.getPropertyValue('--swipe-amount-y').replace('px', '') || 0);
        const elapsedTime = new Date().getTime() - pointerStartTime.current.getTime();
        const swipeAmount = swipeDirection === 'x' ? swipeAmountX : swipeAmountY;
        const velocity = Math.abs(swipeAmount) / elapsedTime;

        if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
          setInitialHeight(offsetBefore + toastIndex * gap);
          toastData.onDismiss?.(toastData);
          setSwipeOutDirection(swipeDirection === 'x' 
            ? (swipeAmountX > 0 ? 'right' : 'left')
            : (swipeAmountY > 0 ? 'down' : 'up')
          );
          handleRemove();
          setSwipeOut(true);
          return;
        }

        toastRef.current?.style.setProperty('--swipe-amount-x', '0px');
        toastRef.current?.style.setProperty('--swipe-amount-y', '0px');
        
        setSwiped(false);
        setSwiping(false);
        setSwipeDirection(null);
      }}
      onPointerMove={(e) => {
        if (!swipeStartPos.current || !dismissible) return;
        if (window.getSelection()?.toString().length > 0) return;

        const deltaY = e.clientY - swipeStartPos.current.y;
        const deltaX = e.clientX - swipeStartPos.current.x;

        if (!swipeDirection && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
          setSwipeDirection(Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y');
        }

        let swipeAmount = { x: 0, y: 0 };
        const directions = swipeDirections || getDefaultSwipeDirections(position);
        const damping = (val) => 1 / (1.5 + Math.abs(val) / 20);

        if (swipeDirection === 'y') {
          if (directions.includes('top') || directions.includes('bottom')) {
            if ((directions.includes('top') && deltaY < 0) || 
                (directions.includes('bottom') && deltaY > 0)) {
              swipeAmount.y = deltaY;
            } else {
              const damped = deltaY * damping(deltaY);
              swipeAmount.y = Math.abs(damped) < Math.abs(deltaY) ? damped : deltaY;
            }
          }
        } else if (swipeDirection === 'x' && (directions.includes('left') || directions.includes('right'))) {
          if ((directions.includes('left') && deltaX < 0) || 
              (directions.includes('right') && deltaX > 0)) {
            swipeAmount.x = deltaX;
          } else {
            const damped = deltaX * damping(deltaX);
            swipeAmount.x = Math.abs(damped) < Math.abs(deltaX) ? damped : deltaX;
          }
        }

        if (Math.abs(swipeAmount.x) > 0 || Math.abs(swipeAmount.y) > 0) {
          setSwiped(true);
        }

        toastRef.current?.style.setProperty('--swipe-amount-x', `${swipeAmount.x}px`);
        toastRef.current?.style.setProperty('--swipe-amount-y', `${swipeAmount.y}px`);
      }}
    >
      {actualCloseButton && !toastData.jsx && type !== 'loading' && (
        <button
          aria-label={closeButtonAriaLabel}
          data-disabled={isLoading}
          data-close-button
          onClick={isLoading || !dismissible ? () => {} : () => {
            handleRemove();
            toastData.onDismiss?.(toastData);
          }}
          className={cn(classNames?.closeButton, toastData.classNames?.closeButton)}
        >
          {icons?.close ?? <CloseIcon />}
        </button>
      )}

      {(type || toastData.icon || toastData.promise) && toastData.icon !== null && 
       (icons?.[type] !== null || toastData.icon) && (
        <div 
          data-icon 
          className={cn(classNames?.icon, toastData.classNames?.icon)}
        >
          {(toastData.promise || (toastData.type === 'loading' && !toastData.icon)) && (
            toastData.icon || renderLoader()
          )}
          {type !== 'loading' && icon}
        </div>
      )}

      <div data-content className={cn(classNames?.content, toastData.classNames?.content)}>
        <div data-title className={cn(classNames?.title, toastData.classNames?.title)}>
          {toastData.jsx 
            ? toastData.jsx 
            : typeof toastData.title === 'function' 
              ? toastData.title() 
              : toastData.title
          }
        </div>
        
        {toastData.description && (
          <div 
            data-description 
            className={cn(
              descriptionClassName,
              toastDescriptionClassName,
              classNames?.description,
              toastData.classNames?.description
            )}
          >
            {typeof toastData.description === 'function'
              ? toastData.description()
              : toastData.description
            }
          </div>
        )}
      </div>

      {isValidElement(toastData.cancel) 
        ? toastData.cancel 
        : toastData.cancel && isAction(toastData.cancel) ? (
          <button
            data-button
            data-cancel
            style={toastData.cancelButtonStyle || cancelButtonStyle}
            onClick={(e) => {
              if (isAction(toastData.cancel) && dismissible) {
                toastData.cancel.onClick?.(e);
                handleRemove();
              }
            }}
            className={cn(classNames?.cancelButton, toastData.classNames?.cancelButton)}
          >
            {toastData.cancel.label}
          </button>
        ) : null
      }

      {isValidElement(toastData.action)
        ? toastData.action
        : toastData.action && isAction(toastData.action) ? (
          <button
            data-button
            data-action
            style={toastData.actionButtonStyle || actionButtonStyle}
            onClick={(e) => {
              if (isAction(toastData.action)) {
                toastData.action.onClick?.(e);
                if (!e.defaultPrevented) {
                  handleRemove();
                }
              }
            }}
            className={cn(classNames?.actionButton, toastData.classNames?.actionButton)}
          >
            {toastData.action.label}
          </button>
        ) : null
      }
    </li>
  );
};

const isAction = (value) => {
  return value.label !== undefined;
};

const getDefaultSwipeDirections = (position) => {
  const [yPos, xPos] = position.split('-');
  const directions = [];
  
  if (yPos) directions.push(yPos);
  if (xPos) directions.push(xPos);
  
  return directions;
};

// ============================================
// Toaster Component
// ============================================

const Toaster = forwardRef(function Toaster(props, ref) {
  const {
    id,
    invert,
    position: defaultPosition = 'bottom-right',
    hotkey = ['altKey', 'KeyT'],
    expand,
    closeButton,
    className,
    offset,
    mobileOffset,
    theme: themeProp = 'light',
    richColors,
    duration,
    style,
    visibleToasts: visibleToastsProp = VISIBLE_TOASTS_AMOUNT,
    toastOptions,
    dir: dirProp = getDefaultDir(),
    gap = GAP,
    icons,
    containerAriaLabel = 'Notifications',
    ...rest
  } = props;

  const [toasts, setToasts] = useState([]);
  const filteredToasts = useMemo(() => 
    id 
      ? toasts.filter(t => t.toasterId === id)
      : toasts.filter(t => !t.toasterId),
    [toasts, id]
  );
  
  const positions = useMemo(() => 
    Array.from(new Set([
      defaultPosition,
      ...filteredToasts.filter(t => t.position).map(t => t.position)
    ])),
    [filteredToasts, defaultPosition]
  );
  
  const [heights, setHeights] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [theme, setTheme] = useState(
    themeProp !== 'system' 
      ? themeProp 
      : typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
  );
  
  const listRef = useRef(null);
  const hotkeyString = hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '');
  const lastFocusedElement = useRef(null);
  const isFocusWithin = useRef(false);

  const removeToast = useCallback((toastToRemove) => {
    setToasts(prev => {
      const found = prev.find(t => t.id === toastToRemove.id);
      if (found?.delete || toastState.dismiss(toastToRemove.id)) {
        return prev.filter(({ id }) => id !== toastToRemove.id);
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = toastState.subscribe((data) => {
      if (data.dismiss) {
        requestAnimationFrame(() => {
          setToasts(prev => prev.map(t => 
            t.id === data.id ? { ...t, delete: true } : t
          ));
        });
        return;
      }

      setTimeout(() => {
        ReactDOM.flushSync(() => {
          setToasts(prev => {
            const index = prev.findIndex(t => t.id === data.id);
            if (index !== -1) {
              return [
                ...prev.slice(0, index),
                { ...prev[index], ...data },
                ...prev.slice(index + 1)
              ];
            }
            return [data, ...prev];
          });
        });
      });
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (themeProp !== 'system') {
      setTheme(themeProp);
      return;
    }

    if (themeProp === 'system') {
      const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
    }

    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = ({ matches }) => {
      setTheme(matches ? 'dark' : 'light');
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
    } catch {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [themeProp]);

  useEffect(() => {
    if (toasts.length <= 1) {
      setExpanded(false);
    }
  }, [toasts]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (hotkey.every(key => e[key] || e.code === key)) {
        setExpanded(true);
        listRef.current?.focus();
      }
      
      if (e.code === 'Escape' && (
        document.activeElement === listRef.current ||
        listRef.current?.contains(document.activeElement)
      )) {
        setExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkey]);

  useEffect(() => {
    if (!listRef.current) return;
    
    return () => {
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus({ preventScroll: true });
        lastFocusedElement.current = null;
        isFocusWithin.current = false;
      }
    };
  }, [listRef.current]);

  return (
    <section
      ref={ref}
      aria-label={`${containerAriaLabel} ${hotkeyString}`}
      tabIndex={-1}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
      suppressHydrationWarning
    >
      {positions.map((pos, posIndex) => {
        const [yPos, xPos] = pos.split('-');
        
        const positionToasts = filteredToasts.filter(t => 
          !t.position && posIndex === 0 || t.position === pos
        );

        if (!positionToasts.length) return null;

        return (
          <ol
            key={pos}
            dir={dirProp === 'auto' ? getDefaultDir() : dirProp}
            tabIndex={-1}
            ref={listRef}
            className={className}
            data-sonner-toaster
            data-sonner-theme={theme}
            data-y-position={yPos}
            data-x-position={xPos}
            style={{
              '--front-toast-height': `${heights[0]?.height || 0}px`,
              '--width': `${TOAST_WIDTH}px`,
              '--gap': `${gap}px`,
              ...style,
              ...getPositionStyles(offset, mobileOffset)
            }}
            onBlur={(e) => {
              if (isFocusWithin.current && !e.currentTarget.contains(e.relatedTarget)) {
                isFocusWithin.current = false;
                if (lastFocusedElement.current) {
                  lastFocusedElement.current.focus({ preventScroll: true });
                  lastFocusedElement.current = null;
                }
              }
            }}
            onFocus={(e) => {
              if (e.target instanceof HTMLElement && 
                  e.target.dataset.dismissible === 'false') {
                return;
              }
              
              if (!isFocusWithin.current) {
                isFocusWithin.current = true;
                lastFocusedElement.current = e.relatedTarget;
              }
            }}
            onMouseEnter={() => setExpanded(true)}
            onMouseMove={() => setExpanded(true)}
            onMouseLeave={() => {
              if (!interacting) setExpanded(false);
            }}
            onDragEnd={() => setExpanded(false)}
            onPointerDown={(e) => {
              if (e.target instanceof HTMLElement && 
                  e.target.dataset.dismissible === 'false') {
                return;
              }
              setInteracting(true);
            }}
            onPointerUp={() => setInteracting(false)}
          >
            {positionToasts.map((toastItem, index) => (
              <Toast
                key={toastItem.id}
                icons={icons}
                index={index}
                toast={toastItem}
                defaultRichColors={richColors}
                duration={toastOptions?.duration ?? duration}
                className={toastOptions?.className}
                descriptionClassName={toastOptions?.descriptionClassName}
                invert={invert}
                visibleToasts={visibleToastsProp}
                closeButton={toastOptions?.closeButton ?? closeButton}
                interacting={interacting}
                position={pos}
                style={toastOptions?.style}
                unstyled={toastOptions?.unstyled}
                classNames={toastOptions?.classNames}
                cancelButtonStyle={toastOptions?.cancelButtonStyle}
                actionButtonStyle={toastOptions?.actionButtonStyle}
                closeButtonAriaLabel={toastOptions?.closeButtonAriaLabel}
                removeToast={removeToast}
                toasts={filteredToasts.filter(t => t.position === toastItem.position)}
                heights={heights.filter(h => h.position === toastItem.position)}
                setHeights={setHeights}
                expandByDefault={expand}
                gap={gap}
                expanded={expanded}
                swipeDirections={rest.swipeDirections}
              />
            ))}
          </ol>
        );
      })}
    </section>
  );
});

// ============================================
// CSS Injection
// ============================================

const injectStyles = () => {
  if (typeof document === 'undefined') return;

  const styleId = 'sonner-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    [data-sonner-toaster][dir=ltr], html[dir=ltr] {
      --toast-icon-margin-start: -3px;
      --toast-icon-margin-end: 4px;
      --toast-svg-margin-start: -1px;
      --toast-svg-margin-end: 0px;
      --toast-button-margin-start: auto;
      --toast-button-margin-end: 0;
      --toast-close-button-start: 0;
      --toast-close-button-end: unset;
      --toast-close-button-transform: translate(-35%, -35%);
    }

    [data-sonner-toaster][dir=rtl], html[dir=rtl] {
      --toast-icon-margin-start: 4px;
      --toast-icon-margin-end: -3px;
      --toast-svg-margin-start: 0px;
      --toast-svg-margin-end: -1px;
      --toast-button-margin-start: 0;
      --toast-button-margin-end: auto;
      --toast-close-button-start: unset;
      --toast-close-button-end: 0;
      --toast-close-button-transform: translate(35%, -35%);
    }

    [data-sonner-toaster] {
      position: fixed;
      width: var(--width);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
      --gray1: hsl(0, 0%, 99%);
      --gray2: hsl(0, 0%, 97.3%);
      --gray3: hsl(0, 0%, 95.1%);
      --gray4: hsl(0, 0%, 93%);
      --gray5: hsl(0, 0%, 90.9%);
      --gray6: hsl(0, 0%, 88.7%);
      --gray7: hsl(0, 0%, 85.8%);
      --gray8: hsl(0, 0%, 78%);
      --gray9: hsl(0, 0%, 56.1%);
      --gray10: hsl(0, 0%, 52.3%);
      --gray11: hsl(0, 0%, 43.5%);
      --gray12: hsl(0, 0%, 9%);
      --border-radius: 8px;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      list-style: none;
      outline: 0;
      z-index: 999999999;
      transition: transform .4s ease;
    }

    @media (hover: none) and (pointer: coarse) {
      [data-sonner-toaster][data-lifted=true] {
        transform: none;
      }
    }

    [data-sonner-toaster][data-x-position=right] {
      right: var(--offset-right);
    }

    [data-sonner-toaster][data-x-position=left] {
      left: var(--offset-left);
    }

    [data-sonner-toaster][data-x-position=center] {
      left: 50%;
      transform: translateX(-50%);
    }

    [data-sonner-toaster][data-y-position=top] {
      top: var(--offset-top);
    }

    [data-sonner-toaster][data-y-position=bottom] {
      bottom: var(--offset-bottom);
    }

    [data-sonner-toast] {
      --y: translateY(100%);
      --lift-amount: calc(var(--lift) * var(--gap));
      z-index: var(--z-index);
      position: absolute;
      opacity: 0;
      transform: var(--y);
      touch-action: none;
      transition: transform .4s, opacity .4s, height .4s, box-shadow .2s;
      box-sizing: border-box;
      outline: 0;
      overflow-wrap: anywhere;
    }

    [data-sonner-toast][data-styled=true] {
      padding: 16px;
      background: var(--normal-bg);
      border: 1px solid var(--normal-border);
      color: var(--normal-text);
      border-radius: var(--border-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,.1);
      width: var(--width);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    [data-sonner-toast]:focus-visible {
      box-shadow: 0 4px 12px rgba(0,0,0,.1), 0 0 0 2px rgba(0,0,0,.2);
    }

    [data-sonner-toast][data-y-position=top] {
      top: 0;
      --y: translateY(-100%);
      --lift: 1;
      --lift-amount: calc(1 * var(--gap));
    }

    [data-sonner-toast][data-y-position=bottom] {
      bottom: 0;
      --y: translateY(100%);
      --lift: -1;
      --lift-amount: calc(var(--lift) * var(--gap));
    }

    [data-sonner-toast][data-styled=true] [data-description] {
      font-weight: 400;
      line-height: 1.4;
      color: #3f3f3f;
    }

    [data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description] {
      color: inherit;
    }

    [data-sonner-toaster][data-sonner-theme=dark] [data-description] {
      color: #e8e8e8;
    }

    [data-sonner-toast][data-styled=true] [data-title] {
      font-weight: 500;
      line-height: 1.5;
      color: inherit;
    }

    [data-sonner-toast][data-styled=true] [data-icon] {
      display: flex;
      height: 16px;
      width: 16px;
      position: relative;
      justify-content: flex-start;
      align-items: center;
      flex-shrink: 0;
      margin-left: var(--toast-icon-margin-start);
      margin-right: var(--toast-icon-margin-end);
    }

    [data-sonner-toast][data-promise=true] [data-icon]>svg {
      opacity: 0;
      transform: scale(.8);
      transform-origin: center;
      animation: sonner-fade-in .3s ease forwards;
    }

    [data-sonner-toast][data-styled=true] [data-icon]>* {
      flex-shrink: 0;
    }

    [data-sonner-toast][data-styled=true] [data-icon] svg {
      margin-left: var(--toast-svg-margin-start);
      margin-right: var(--toast-svg-margin-end);
    }

    [data-sonner-toast][data-styled=true] [data-content] {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    [data-sonner-toast][data-styled=true] [data-button] {
      border-radius: 4px;
      padding-left: 8px;
      padding-right: 8px;
      height: 24px;
      font-size: 12px;
      color: var(--normal-bg);
      background: var(--normal-text);
      margin-left: var(--toast-button-margin-start);
      margin-right: var(--toast-button-margin-end);
      border: none;
      font-weight: 500;
      cursor: pointer;
      outline: 0;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: opacity .4s, box-shadow .2s;
    }

    [data-sonner-toast][data-styled=true] [data-button]:focus-visible {
      box-shadow: 0 0 0 2px rgba(0,0,0,.4);
    }

    [data-sonner-toast][data-styled=true] [data-button]:first-of-type {
      margin-left: var(--toast-button-margin-start);
      margin-right: var(--toast-button-margin-end);
    }

    [data-sonner-toast][data-styled=true] [data-cancel] {
      color: var(--normal-text);
      background: rgba(0,0,0,.08);
    }

    [data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel] {
      background: rgba(255,255,255,.3);
    }

    [data-sonner-toast][data-styled=true] [data-close-button] {
      position: absolute;
      left: var(--toast-close-button-start);
      right: var(--toast-close-button-end);
      top: 0;
      height: 20px;
      width: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      color: var(--gray12);
      background: var(--normal-bg);
      border: 1px solid var(--gray4);
      transform: var(--toast-close-button-transform);
      border-radius: 50%;
      cursor: pointer;
      z-index: 1;
      transition: opacity .1s, background .2s, border-color .2s;
    }

    [data-sonner-toast][data-styled=true] [data-close-button]:focus-visible {
      box-shadow: 0 4px 12px rgba(0,0,0,.1), 0 0 0 2px rgba(0,0,0,.2);
    }

    [data-sonner-toast][data-styled=true] [data-disabled=true] {
      cursor: not-allowed;
    }

    [data-sonner-toast][data-styled=true]:hover [data-close-button]:hover {
      background: var(--gray2);
      border-color: var(--gray5);
    }

    [data-sonner-toast][data-swiping=true]::before {
      content: '';
      position: absolute;
      left: -100%;
      right: -100%;
      height: 100%;
      z-index: -1;
    }

    [data-sonner-toast][data-y-position=top][data-swiping=true]::before {
      bottom: 50%;
      transform: scaleY(3) translateY(50%);
    }

    [data-sonner-toast][data-y-position=bottom][data-swiping=true]::before {
      top: 50%;
      transform: scaleY(3) translateY(-50%);
    }

    [data-sonner-toast][data-swiping=false][data-removed=true]::before {
      content: '';
      position: absolute;
      inset: 0;
      transform: scaleY(2);
    }

    [data-sonner-toast][data-expanded=true]::after {
      content: '';
      position: absolute;
      left: 0;
      height: calc(var(--gap) + 1px);
      bottom: 100%;
      width: 100%;
    }

    [data-sonner-toast][data-mounted=true] {
      --y: translateY(0);
      opacity: 1;
    }

    [data-sonner-toast][data-expanded=false][data-front=false] {
      --scale: calc(var(--toasts-before) * 0.05 + 1);
      --y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));
      height: var(--front-toast-height);
    }

    [data-sonner-toast]>* {
      transition: opacity .4s;
    }

    [data-sonner-toast][data-x-position=right] {
      right: 0;
    }

    [data-sonner-toast][data-x-position=left] {
      left: 0;
    }

    [data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>* {
      opacity: 0;
    }

    [data-sonner-toast][data-visible=false] {
      opacity: 0;
      pointer-events: none;
    }

    [data-sonner-toast][data-mounted=true][data-expanded=true] {
      --y: translateY(calc(var(--lift) * var(--offset)));
      height: var(--initial-height);
    }

    [data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false] {
      --y: translateY(calc(var(--lift) * -100%));
      opacity: 0;
    }

    [data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true] {
      --y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));
      opacity: 0;
    }

    [data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false] {
      --y: translateY(40%);
      opacity: 0;
      transition: transform .5s, opacity .2s;
    }

    [data-sonner-toast][data-removed=true][data-front=false]::before {
      height: calc(var(--initial-height) + 20%);
    }

    [data-sonner-toast][data-swiping=true] {
      transform: var(--y) translateY(var(--swipe-amount-y, 0)) translateX(var(--swipe-amount-x, 0));
      transition: none;
    }

    [data-sonner-toast][data-swiped=true] {
      user-select: none;
    }

    [data-sonner-toast][data-swipe-out=true][data-y-position=bottom],
    [data-sonner-toast][data-swipe-out=true][data-y-position=top] {
      animation-duration: .2s;
      animation-timing-function: ease-out;
      animation-fill-mode: forwards;
    }

    [data-sonner-toast][data-swipe-out=true][data-swipe-direction=left] {
      animation-name: swipe-out-left;
    }

    [data-sonner-toast][data-swipe-out=true][data-swipe-direction=right] {
      animation-name: swipe-out-right;
    }

    [data-sonner-toast][data-swipe-out=true][data-swipe-direction=up] {
      animation-name: swipe-out-up;
    }

    [data-sonner-toast][data-swipe-out=true][data-swipe-direction=down] {
      animation-name: swipe-out-down;
    }

    @keyframes swipe-out-left {
      from {
        transform: var(--y) translateX(var(--swipe-amount-x));
        opacity: 1;
      }
      to {
        transform: var(--y) translateX(calc(var(--swipe-amount-x) - 100%));
        opacity: 0;
      }
    }

    @keyframes swipe-out-right {
      from {
        transform: var(--y) translateX(var(--swipe-amount-x));
        opacity: 1;
      }
      to {
        transform: var(--y) translateX(calc(var(--swipe-amount-x) + 100%));
        opacity: 0;
      }
    }

    @keyframes swipe-out-up {
      from {
        transform: var(--y) translateY(var(--swipe-amount-y));
        opacity: 1;
      }
      to {
        transform: var(--y) translateY(calc(var(--swipe-amount-y) - 100%));
        opacity: 0;
      }
    }

    @keyframes swipe-out-down {
      from {
        transform: var(--y) translateY(var(--swipe-amount-y));
        opacity: 1;
      }
      to {
        transform: var(--y) translateY(calc(var(--swipe-amount-y) + 100%));
        opacity: 0;
      }
    }

    @media (max-width: 600px) {
      [data-sonner-toaster] {
        position: fixed;
        right: var(--mobile-offset-right);
        left: var(--mobile-offset-left);
        width: 100%;
      }

      [data-sonner-toaster][dir=rtl] {
        left: calc(var(--mobile-offset-left) * -1);
      }

      [data-sonner-toaster] [data-sonner-toast] {
        left: 0;
        right: 0;
        width: calc(100% - var(--mobile-offset-left) * 2);
      }

      [data-sonner-toaster][data-x-position=left] {
        left: var(--mobile-offset-left);
      }

      [data-sonner-toaster][data-y-position=bottom] {
        bottom: var(--mobile-offset-bottom);
      }

      [data-sonner-toaster][data-y-position=top] {
        top: var(--mobile-offset-top);
      }

      [data-sonner-toaster][data-x-position=center] {
        left: var(--mobile-offset-left);
        right: var(--mobile-offset-right);
        transform: none;
      }
    }

    [data-sonner-toaster][data-sonner-theme=light] {
      --normal-bg: #fff;
      --normal-border: var(--gray4);
      --normal-text: var(--gray12);
      --success-bg: hsl(143, 85%, 96%);
      --success-border: hsl(145, 92%, 87%);
      --success-text: hsl(140, 100%, 27%);
      --info-bg: hsl(208, 100%, 97%);
      --info-border: hsl(221, 91%, 93%);
      --info-text: hsl(210, 92%, 45%);
      --warning-bg: hsl(49, 100%, 97%);
      --warning-border: hsl(49, 91%, 84%);
      --warning-text: hsl(31, 92%, 45%);
      --error-bg: hsl(359, 100%, 97%);
      --error-border: hsl(359, 100%, 94%);
      --error-text: hsl(360, 100%, 45%);
    }

    [data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true] {
      --normal-bg: #000;
      --normal-border: hsl(0, 0%, 20%);
      --normal-text: var(--gray1);
    }

    [data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true] {
      --normal-bg: #fff;
      --normal-border: var(--gray3);
      --normal-text: var(--gray12);
    }

    [data-sonner-toaster][data-sonner-theme=dark] {
      --normal-bg: #000;
      --normal-bg-hover: hsl(0, 0%, 12%);
      --normal-border: hsl(0, 0%, 20%);
      --normal-border-hover: hsl(0, 0%, 25%);
      --normal-text: var(--gray1);
      --success-bg: hsl(150, 100%, 6%);
      --success-border: hsl(147, 100%, 12%);
      --success-text: hsl(150, 86%, 65%);
      --info-bg: hsl(215, 100%, 6%);
      --info-border: hsl(223, 43%, 17%);
      --info-text: hsl(216, 87%, 65%);
      --warning-bg: hsl(64, 100%, 6%);
      --warning-border: hsl(60, 100%, 9%);
      --warning-text: hsl(46, 87%, 65%);
      --error-bg: hsl(358, 76%, 10%);
      --error-border: hsl(357, 89%, 16%);
      --error-text: hsl(358, 100%, 81%);
    }

    [data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button] {
      background: var(--normal-bg);
      border-color: var(--normal-border);
      color: var(--normal-text);
    }

    [data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover {
      background: var(--normal-bg-hover);
      border-color: var(--normal-border-hover);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=success] {
      background: var(--success-bg);
      border-color: var(--success-border);
      color: var(--success-text);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button] {
      background: var(--success-bg);
      border-color: var(--success-border);
      color: var(--success-text);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=info] {
      background: var(--info-bg);
      border-color: var(--info-border);
      color: var(--info-text);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button] {
      background: var(--info-bg);
      border-color: var(--info-border);
      color: var(--info-text);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=warning] {
      background: var(--warning-bg);
      border-color: var(--warning-border);
      color: var(--warning-text);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button] {
      background: var(--warning-bg);
      border-color: var(--warning-border);
      color: var(--warning-text);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=error] {
      background: var(--error-bg);
      border-color: var(--error-border);
      color: var(--error-text);
    }

    [data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button] {
      background: var(--error-bg);
      border-color: var(--error-border);
      color: var(--error-text);
    }

    .sonner-loading-wrapper {
      --size: 16px;
      height: var(--size);
      width: var(--size);
      position: absolute;
      inset: 0;
      z-index: 10;
    }

    .sonner-loading-wrapper[data-visible=false] {
      transform-origin: center;
      animation: sonner-fade-out .2s ease forwards;
    }

    .sonner-spinner {
      position: relative;
      top: 50%;
      left: 50%;
      height: var(--size);
      width: var(--size);
    }

    .sonner-loading-bar {
      animation: sonner-spin 1.2s linear infinite;
      background: var(--gray11);
      border-radius: 6px;
      height: 8%;
      left: -10%;
      position: absolute;
      top: -3.9%;
      width: 24%;
    }

    .sonner-loading-bar:first-child {
      animation-delay: -1.2s;
      transform: rotate(0.0001deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(2) {
      animation-delay: -1.1s;
      transform: rotate(30deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(3) {
      animation-delay: -1s;
      transform: rotate(60deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(4) {
      animation-delay: -0.9s;
      transform: rotate(90deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(5) {
      animation-delay: -0.8s;
      transform: rotate(120deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(6) {
      animation-delay: -0.7s;
      transform: rotate(150deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(7) {
      animation-delay: -0.6s;
      transform: rotate(180deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(8) {
      animation-delay: -0.5s;
      transform: rotate(210deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(9) {
      animation-delay: -0.4s;
      transform: rotate(240deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(10) {
      animation-delay: -0.3s;
      transform: rotate(270deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(11) {
      animation-delay: -0.2s;
      transform: rotate(300deg) translate(146%);
    }

    .sonner-loading-bar:nth-child(12) {
      animation-delay: -0.1s;
      transform: rotate(330deg) translate(146%);
    }

    @keyframes sonner-fade-in {
      0% {
        opacity: 0;
        transform: scale(0.8);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes sonner-fade-out {
      0% {
        opacity: 1;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(0.8);
      }
    }

    @keyframes sonner-spin {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0.15;
      }
    }

    @media (prefers-reduced-motion) {
      .sonner-loading-bar,
      [data-sonner-toast],
      [data-sonner-toast]>* {
        transition: none !important;
        animation: none !important;
      }
    }

    .sonner-loader {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transform-origin: center;
      transition: opacity .2s, transform .2s;
    }

    .sonner-loader[data-visible=false] {
      opacity: 0;
      transform: scale(0.8) translate(-50%, -50%);
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
};

// ============================================
// Initialize
// ============================================

injectStyles();

// ============================================
// Exports
// ============================================

export { Toaster, toastAPI as toast };
export default toastAPI;
