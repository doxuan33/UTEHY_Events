import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { checkinApi } from '@/api/checkin.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Camera, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ScanQR = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const startScanner = () => {
    setStatus('scanning');
    // Use a slight delay to ensure the container is rendered
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );
      
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }, 100);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (status === 'processing') return;
    
    // Stop scanner immediately to prevent multiple scans
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to clear scanner", err);
      }
    }

    setStatus('processing');
    try {
      const res = await checkinApi.scanQr({
        token: decodedText
      });
      
      setStatus('success');
      setMessage(res.data.message || 'Điểm danh thành công!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Điểm danh thất bại. Vui lòng thử lại.');
    }
  };

  const onScanFailure = (error: any) => {
    // console.warn(`Code scan error = ${error}`);
  };

  const resetScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    setStatus('idle');
    setMessage('');
    startScanner();
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Quay lại
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Điểm danh sự kiện</h1>
          <p className="text-gray-500 text-sm mb-6">Quét mã QR do Ban tổ chức cung cấp để xác nhận tham gia</p>

          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-10"
              >
                <div className="h-40 w-40 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Camera className="h-20 w-20 text-blue-600" />
                </div>
                <Button 
                  onClick={startScanner}
                  className="w-full py-6 text-lg rounded-2xl shadow-lg shadow-blue-100"
                >
                  Bắt đầu quét mã
                </Button>
              </motion.div>
            )}

            {status === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div id="reader" className="overflow-hidden rounded-2xl border-2 border-blue-100 shadow-inner"></div>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center"
              >
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
                <p className="font-bold text-gray-900">Đang xác thực điểm danh...</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thành công!</h3>
                <p className="text-gray-600 mb-8">{message}</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full py-4 rounded-xl"
                >
                  Về trang chủ
                </Button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-16 w-16 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thất bại</h3>
                <p className="text-gray-600 mb-8">{message}</p>
                <div className="space-y-3">
                  <Button 
                    onClick={resetScanner}
                    className="w-full py-4 rounded-xl"
                  >
                    Thử lại
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="w-full py-4 rounded-xl"
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Lưu ý quan trọng
        </h4>
        <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
          <li>Mã QR là mã động, sẽ thay đổi sau mỗi 15 giây để tránh gian lận.</li>
          <li>Vui lòng đưa camera lại gần mã QR để quét chính xác.</li>
        </ul>
      </div>
    </div>
  );
};
