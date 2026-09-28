# LINE 關課推送 App 告警

2026-09-28 新增。告警使用既有 OneSignal 與站內訊息，不依赖 LINE 客服轉送。

- 既有 `runCourseClosureScheduler` 每 5 分鐘執行，22:30–23:59 檢查。
- 明確 failed/expired/revoked 在下一輪檢查告警；22:35 起，缺少今晚結果、尚未送達兩人或狀態服務無法連線亦告警。
- 明確沒有社群徵人文字的成功關課結果不告警。正常成功也不另發一則成功通知。
- 收件人僅「冠蓉」、「Tako」。兩人都 accepted 後，如果先前已發告警，再發一次恢復通知。
- 同晚固定事件 ID，收件匣去重；OneSignal 重試沿用 UUID idempotency_key。每種通知最多嘗試 3 次。
- 不重跑關課、不改課表、不重送 LINE 原文。只新增站內通知及相關收件紀錄，狀態存 Script Properties。
- Worker `/delivery-status` 使用原交付密鑰驗證，只讀指定日期兩個角色的狀態，不回傳 LINE ID 或訊息內容。

## 限制

五分鐘排程不是精確秒級。若 GAS 排程本身完全停止，或 App 推播／裝置通知權限失效，不能保證手機即時提醒；站內通知成功寫入時仍可到收件匣查看。這不是獨立於 GAS 的外部監控。

## 發布

GAS v191。Worker `2ef7afb8-164c-4dc2-8501-9daa45a7ef83`。859 項回歸測試通過。保留 LINE UTF-8、轉送、防重複鍵與自主練習預留功能。

OneSignal 重試依官方 API 的 idempotency_key：
https://github.com/OneSignal/onesignal-node-api
