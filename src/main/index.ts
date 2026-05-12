import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 640,
    minHeight: 480,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('getAccounts', async () => {
    return [
      {
        id: '1',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        provider: 'gmail'
      },
      {
        id: '2',
        email: 'alice@work.com',
        name: 'Alice Johnson',
        provider: 'outlook'
      }
    ]
  })

  ipcMain.handle('listThreads', async (_event, params) => {
    const { cursor } = params
    const pageSize = params.pageSize ?? 25

    const subjects = [
      'Q4 Engineering Roadmap Review',
      'Re: Design System Token Migration',
      'Sprint Demo Recordings — Nov 15',
      'Lunch this week?',
      'Fwd: Updated NDA — please sign',
      'GitHub Actions: new self-hosted runners',
      'Product Launch Checklist',
      'Re: Budget Approval for Design Tools',
      'Team Offsite — save the date',
      'Weekly Standup Notes'
    ]

    const names = [
      'Sarah Chen',
      'Marcus Rivera',
      'Jamie Kim',
      'Taylor Wu',
      'Jordan Lee',
      'Priya Patel',
      'Alex Morgan',
      'Casey Brown'
    ]

    const snippets = [
      'Here is the updated roadmap covering Q4 milestones for the engineering team. Key deliverables include...',
      'Thanks for the review! I have updated the color tokens and spacing scale to align with the new...',
      "Here are the recordings from today's sprint demo. Please review and add your feedback by EOD...",
      'Hey! Was wondering if you are free for lunch this week? I wanted to catch up on the...',
      '---------- Forwarded message --------- From: Legal Team <legal@example.com> Date:...',
      'We have set up three new self-hosted runners for the CI pipeline. They are configured with...',
      "Don't forget to review the launch checklist before tomorrow's go/no-go meeting. We need...",
      'The budget request for Figma, Sketch, and Maze licenses has been approved. Please proceed...',
      'Save the date for our team offsite on December 12-14. More details to follow, but wanted to...',
      "Here are the notes from today's standup. Key items: database migration progress, API..."
    ]

    const startIndex = cursor ? parseInt(cursor, 10) : 0
    const threads = Array.from({ length: Math.min(pageSize, 10) }, (_, i) => {
      const idx = (startIndex + i) % subjects.length
      const nameIdx = (startIndex + i) % names.length
      return {
        id: `thread-${startIndex + i}`,
        subject: subjects[idx],
        snippet: snippets[idx],
        lastMessageAt: new Date(
          Date.now() -
            (startIndex + i) * 3600000 -
            Math.random() * 7200000
        ).toISOString(),
        from: {
          name: names[nameIdx],
          email: `${names[nameIdx].toLowerCase().replace(/\s+/g, '.')}@example.com`
        },
        to: [
          {
            name: 'Alice Johnson',
            email: 'alice@example.com'
          }
        ],
        unread: (startIndex + i) % 3 === 0,
        hasAttachments: (startIndex + i) % 5 === 0,
        labels: []
      }
    })

    const nextStart = startIndex + pageSize
    const hasMore = nextStart < 50

    return {
      threads,
      nextCursor: hasMore ? String(nextStart) : undefined,
      hasMore
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.genmail')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
