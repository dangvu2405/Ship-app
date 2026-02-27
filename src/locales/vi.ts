export const vi = {
  // Common
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    view: 'Xem',
    create: 'Tạo mới',
    update: 'Cập nhật',
    search: 'Tìm kiếm',
    reset: 'Đặt lại',
    submit: 'Gửi',
    back: 'Quay lại',
    next: 'Tiếp theo',
    previous: 'Trước đó',
    close: 'Đóng',
    confirm: 'Xác nhận',
    yes: 'Có',
    no: 'Không',
    ok: 'OK',
    loading: 'Đang tải...',
    noData: 'Không có dữ liệu',
    actions: 'Thao tác',
    status: 'Trạng thái',
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    enabled: 'Bật',
    disabled: 'Tắt',
  },

  // Auth
  auth: {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    register: 'Đăng ký',
    email: 'Email',
    password: 'Mật khẩu',
    rememberMe: 'Ghi nhớ đăng nhập',
    forgotPassword: 'Quên mật khẩu?',
    loginSuccess: 'Đăng nhập thành công',
    loginFailed: 'Đăng nhập thất bại',
    invalidCredentials: 'Thông tin đăng nhập không hợp lệ',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    skipLogin: 'Bỏ qua đăng nhập (Demo)',
  },

  // Dashboard
  dashboard: {
    title: 'Bảng điều khiển',
    welcome: 'Chào mừng',
    overview: 'Tổng quan',
    statistics: 'Thống kê',
    recentActivity: 'Hoạt động gần đây',
  },

  // Companies
  companies: {
    title: 'Công ty',
    name: 'Tên công ty',
    code: 'Mã công ty',
    taxCode: 'Mã số thuế',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
    createCompany: 'Tạo công ty',
    editCompany: 'Sửa công ty',
    deleteCompany: 'Xóa công ty',
    companyCreated: 'Tạo công ty thành công',
    companyUpdated: 'Cập nhật công ty thành công',
    companyDeleted: 'Xóa công ty thành công',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa công ty này?',
  },

  // Employees
  employees: {
    title: 'Nhân viên',
    name: 'Tên nhân viên',
    code: 'Mã nhân viên',
    email: 'Email',
    type: 'Loại',
    driver: 'Tài xế',
    office: 'Văn phòng',
    createEmployee: 'Tạo nhân viên',
    editEmployee: 'Sửa nhân viên',
    deleteEmployee: 'Xóa nhân viên',
    employeeCreated: 'Tạo nhân viên thành công',
    employeeUpdated: 'Cập nhật nhân viên thành công',
    employeeDeleted: 'Xóa nhân viên thành công',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa nhân viên này?',
  },

  // Vehicles
  vehicles: {
    title: 'Xe',
    licensePlate: 'Biển số xe',
    vehicleType: 'Loại xe',
    brand: 'Hãng xe',
    model: 'Model',
    createVehicle: 'Tạo xe',
    editVehicle: 'Sửa xe',
    deleteVehicle: 'Xóa xe',
  },

  // Trips
  trips: {
    title: 'Chuyến đi',
    tripCode: 'Mã chuyến đi',
    origin: 'Điểm đi',
    destination: 'Điểm đến',
    createTrip: 'Tạo chuyến đi',
    editTrip: 'Sửa chuyến đi',
    deleteTrip: 'Xóa chuyến đi',
  },

  // Payrolls
  payrolls: {
    title: 'Bảng lương',
    period: 'Kỳ lương',
    employee: 'Nhân viên',
    amount: 'Số tiền',
    createPayroll: 'Tạo bảng lương',
    editPayroll: 'Sửa bảng lương',
    deletePayroll: 'Xóa bảng lương',
  },

  // Reports
  reports: {
    title: 'Báo cáo',
    generate: 'Tạo báo cáo',
    export: 'Xuất',
    print: 'In',
  },

  // Users
  users: {
    title: 'Người dùng',
    username: 'Tên đăng nhập',
    email: 'Email',
    role: 'Vai trò',
    createUser: 'Tạo người dùng',
    editUser: 'Sửa người dùng',
    deleteUser: 'Xóa người dùng',
  },

  // Header
  header: {
    profile: 'Hồ sơ',
    settings: 'Cài đặt',
    notifications: 'Thông báo',
    searchPlaceholder: 'Tìm kiếm...',
  },

  // Validation
  validation: {
    required: 'Trường này là bắt buộc',
    email: 'Vui lòng nhập email hợp lệ',
    minLength: 'Tối thiểu {min} ký tự',
    maxLength: 'Tối đa {max} ký tự',
    min: 'Giá trị tối thiểu là {min}',
    max: 'Giá trị tối đa là {max}',
  },

  // Messages
  messages: {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    deleteSuccess: 'Xóa thành công',
    deleteError: 'Xóa thất bại',
    saveSuccess: 'Lưu thành công',
    saveError: 'Lưu thất bại',
    updateSuccess: 'Cập nhật thành công',
    updateError: 'Cập nhật thất bại',
    createSuccess: 'Tạo thành công',
    createError: 'Tạo thất bại',
    networkError: 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng.',
    serverError: 'Lỗi máy chủ. Vui lòng thử lại sau.',
    accessDenied: 'Không có quyền truy cập',
  },
};
