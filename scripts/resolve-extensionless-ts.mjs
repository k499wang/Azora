export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isExtensionlessRelative =
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !/[./][cm]?[jt]sx?$/.test(specifier);

    if (!isExtensionlessRelative || error?.code !== 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }

    return nextResolve(`${specifier}.ts`, context);
  }
}
