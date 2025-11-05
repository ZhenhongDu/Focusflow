import { useState, useEffect } from 'react';

/**
 * 自定义Hook：检测是否为移动设备
 * @returns boolean - true表示是移动设备
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始检查
    checkMobile();

    // 添加resize事件监听器
    window.addEventListener('resize', checkMobile);

    // 清理函数
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
};

/**
 * 自定义Hook：检测是否为平板设备
 * @returns boolean - true表示是平板设备
 */
export const useIsTablet = (): boolean => {
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };

    // 初始检查
    checkTablet();

    // 添加resize事件监听器
    window.addEventListener('resize', checkTablet);

    // 清理函数
    return () => {
      window.removeEventListener('resize', checkTablet);
    };
  }, []);

  return isTablet;
};

/**
 * 自定义Hook：通用媒体查询
 * @param query CSS媒体查询字符串
 * @returns boolean - true表示匹配查询条件
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // 初始检查
    setMatches(mediaQuery.matches);

    // 定义事件处理函数
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 添加事件监听器
    mediaQuery.addEventListener('change', handler);

    // 清理函数
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
};