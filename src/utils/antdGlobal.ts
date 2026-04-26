import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';

let _message: MessageInstance;
let _notification: NotificationInstance;
let _modal: Omit<ModalStaticFunctions, 'warn'>;

export const antdUtils = {
  setMessageInstance(i: MessageInstance)                       { _message      = i; },
  setNotificationInstance(i: NotificationInstance)             { _notification = i; },
  setModalInstance(i: Omit<ModalStaticFunctions, 'warn'>)      { _modal        = i; },

  getMessage():      MessageInstance                           { if (!_message)      throw new Error('[antdUtils] message chưa init');      return _message;      },
  getNotification(): NotificationInstance                      { if (!_notification) throw new Error('[antdUtils] notification chưa init'); return _notification; },
  getModal():        Omit<ModalStaticFunctions, 'warn'>        { if (!_modal)        throw new Error('[antdUtils] modal chưa init');        return _modal;        },
};
