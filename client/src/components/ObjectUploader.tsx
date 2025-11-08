import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";

interface ObjectUploaderProps {
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onUploadComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  accept?: string;
  allowedMetaFields?: string[];
  restrictions?: {
    maxFileSize?: number;
    maxNumberOfFiles?: number;
    minNumberOfFiles?: number;
    allowedFileTypes?: string[];
  };
  render?: (props: { browseFiles: () => void }) => ReactNode;
}

export function ObjectUploader({
  onGetUploadParameters,
  onUploadComplete,
  accept,
  allowedMetaFields = [],
  restrictions = {},
  render,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: restrictions.maxNumberOfFiles || 1,
        maxFileSize: restrictions.maxFileSize || 10485760,
        allowedFileTypes: restrictions.allowedFileTypes || undefined,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onUploadComplete?.(result);
      })
  );

  const browseFiles = () => {
    setShowModal(true);
  };

  return (
    <div>
      {render?.({ browseFiles })}

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
