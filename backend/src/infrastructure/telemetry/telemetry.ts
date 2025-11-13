import { NodeSDK } from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

let sdk: NodeSDK | null = null;

export function initializeTelemetry() {
  if (sdk || process.env.NODE_ENV === 'test') {
    return;
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()]
  });

  (async () => {
    try {
      await sdk?.start();
    } catch (error: unknown) {
      console.error('Falha ao iniciar OpenTelemetry SDK', error);
    }
  })();
}

export async function shutdownTelemetry() {
  if (!sdk) {
    return;
  }

  try {
    await sdk.shutdown();
  } catch (error) {
    console.error('Falha ao encerrar OpenTelemetry SDK', error);
  } finally {
    sdk = null;
  }
}

