var AP_Pitch = false
    var AP_Roll = false
    var AP_Speed = false
    var AP_Vspeed = false
    var AP_Altitude = false
    var AP_Climb = false
    var AP_G = false
    var AP_HDG = false
    var AP_NAV = false
    var AP_GS = false
    var AP_Land = false

    var AP_is_ON = false

    var tgt_pitch = 20
    var tgt_roll = 0
    var tgt_spd = 400 // kt
    var tgt_vs = 2000

    var tgt_alt = 33000
    var tgt_hdg = 0180

    var maxg = 2
    var ming = 0

    //thrust
    var tKp = 0.11
    var tKi = 0.0005
    var tKd = .0

    //pitch
    var pKp = 0.2
    var pKi = 0.01
    var pKd =  - .2
    var pKg = .1
    var pKdg = .1

    //roll
    var Kp = 0.01
    var Ki = 0.0000
    var Kd =  - .20

    //vertical speed
    var vsKp = 0.000
    var vsKi = 0.01
    var vsKd = -0.000
    var vsKg = .1
    var vsKdg = .1

    //Altitude
    var aKp = 100
    var aKi = 0.1
    var aKd = 10

    //climb
    var cKp = 0.5
    var cKi = .004
    var cKd = -0.0
    var cKg = 0.1
    var cKdg = 0.1

    //nav
    var nKp = .0010

    var tgt_g = 1
    var gKp = .01
    prev_gload = 1
    dgload_limit = .1
    gKp_max = .01
    gKp_min = .0000000000001

    gload = 1
    prev_gload = 1
    g_error = 0
    dgload = 0
    dpitch_limit = .3
function control_load_factor(asked_LF) {

    gload = geofs.animation.values.loadFactor

        dgload = prev_gload - gload

        asked_LF = Math.min(maxg, Math.max(asked_LF, ming))

        g_error = gload - asked_LF

        if (Math.abs(dgload) > dgload_limit) {
            gKp /= 1.05
        } else {

            gKp *= 1.05

        }

        gKp = Math.min(gKp_max, Math.max(gKp_min, gKp))

        if (!geofs.animation.values.groundContact || speed > 80) {

            controls.rawPitch -= g_error * gKp
        }

        if (geofs.animation.values.groundContact) {
            controls.rawPitch = Math.min(.4, controls.rawPitch)
        }
        if (geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet < 1000) {
            controls.rawPitch = Math.max(0, controls.rawPitch)

                if (Math.abs(dpitch) > dpitch_limit) {
                    controls.rawPitch *= .95
                }

        }
        prev_gload = gload

}
CI = 0
    prev_err = 0
function control_roll(asked_roll) {

    roll = geofs.animation.values.aroll

        err = asked_roll + roll

        CP = Kp * err
        CI += err * Ki
        CD = (prev_err - err) * Kd

        CI = Math.max(-1, CI)
        CI = Math.min(1, CI)

        prev_err = err

        controls.roll = CP + CI + CD

}
vs_preverror = 0
    vsCI = 0
    vs_error = 0
    vs_prev_error = 0
    dvs_limit = 200 // 2000fpm de variation par seconde
    // function control_vspeed(){
    // vspeed = geofs.animation.values.verticalSpeed
    // vs_error=tgt_vs-vspeed
    // catch_limit=1
    // if (Math.abs(vs_error)<500){catch_limit=.01}

    // dvs=vspeed-vs_prev

    // vsCP=vs_error*vsKp
    // vsCI+=vs_error*vsKi

    // if (Math.abs(dvs)>dvs_limit*catch_limit){

    // vsCI+=.5*Math.sign(vs_error)
    // }

    // vsCI = Math.max(-60, vsCI)
    // vsCI = Math.min(70, vsCI)


    // control_pitch(vsCP+vsCI)
    // pp.innerHTML="PITCH "+Math.round(100*(vsCI+vsCP))/100
    // vs_prev=vspeed
    // }
    vs_pitch = 0
    ampli_high = 10
    ampli_low = 5
    ampli_land = 8
old_vspeed=0
k_v_acc=1
k_v_acc_limit=10

function control_vspeed() {
    	vspeed = geofs.animation.values.verticalSpeed

	v_acc=vspeed-old_vspeed
	
	old_vspeed=vspeed
        
	
	vs_error = tgt_vs - vspeed
   
	v_acc_limit=vs_error*k_v_acc_limit
	vsCA=0

        ampli = 1

        height = geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet

        if (height > 500) {
            if (Math.abs(vs_error) > 1000) {
                ampli = ampli_high
            } else if (Math.abs(vs_error) > 500) {
                ampli = ampli_low
            }
		if(Math.abs(v_acc)>Math.abs(v_acc_limit)){
	
			vsCA=	(v_acc+Math.sign(v_acc_limit))*k_v_acc
	        	
			
		}
        }
        if (AP_Land) {
            ampli = ampli_land
        }

        vsCP = vs_error * vsKp
        if (AP_Land)  {vsCI += Math.max(0,ampli * vsKi * Math.sign(vs_error))}
	else
		{vsCI += ampli * vsKi * Math.sign(vs_error)}
        vsCD = vsKd * (vs_error - vs_prev_error)

        vsCI = Math.max(-30, Math.min(30, vsCI))
	

	vs_pitch = vsCP + vsCI + vsCD + vsCA
        cCI = pitch
        control_pitch(vs_pitch)
        vs_prev_error = vs_error
        pp.innerHTML = "PITCH " + Math.round(100 * (vs_pitch)) / 100
}

alti_error = 0
    ask_vs = 0

function control_altitude(asked_altitude) {

    altitude = geofs.animation.values.altitude
        alti_error = asked_altitude - altitude

        if (Math.abs(alti_error) > 1000) {

            if (AP_Climb) {

                climb()

            } else {

                if (!AP_Vspeed) {
                    toggle_VS()
                }
                tgt_vs = Math.abs(tgt_vs) * Math.sign(alti_error)
                    if (tgt_vs == 0) {
                        tgt_vs = 2000 * Math.sign(alti_error)
                    }
                    ask_vs = tgt_vs
                    cCI = ask_vs
            }
        } else {
            if (AP_Climb) {
                toggle_Climb()
            }
            if (AP_Vspeed) {
                toggle_VS()
            }

            //ask_vs=1000*Math.atan(alti_error/aKp)/(Math.PI/2)
            tgt_vs = 1000 * alti_error / aKp //*Math.abs(alti_error)/aKp
                tgt_vs = Math.max(-2000, Math.min(2000, tgt_vs))
                control_vspeed()
        }

}
cCI = 0
function climb() {

    if (alti_error > 0 && terr > 15) {

        tgt_vs = 1000

            tprev_err = 0
            control_vspeed()
            pcl.style.background = "orange";
        cCI = pitch
    } else {
        pcl.style.background = "green";
        //if (Math.sign(cCI*alti_error)<0){cCI=0}
        cCP = -terr * cKp
            cCI -= terr * cKi
            cCD = (terr - tprev_err) * cKd

            tprev_err = terr

            cCI = Math.max(cCI, -25)
            cCI = Math.min(cCI, 25)

            ask_pitch = cCP + cCI + cCD

            ask_pitch = Math.max(ask_pitch, -25)
            ask_pitch = Math.min(ask_pitch, 25)
            control_pitch(ask_pitch)

    }

}

tCI = 0
    tprev_err = 0
    speed = 0
function control_speed(asked_speed) {

    terr = asked_speed - speed

        if (AP_Climb) {
            if (alti_error > 0) {
                controls.throttle = 1
            }
            if (alti_error < 0) {
                controls.throttle = 0
            }
        } else {

            tCP = tKp * terr
                tCI += terr * tKi
                tCD = (terr - tprev_err) * tKd

                tCI = Math.max(0, tCI)
                tCI = Math.min(1, tCI)

                tprev_err = terr

                controls.throttle = Math.max(0, tCP + tCI + tCD)
        }
}

error_hdg = 0
    turning_roll = 50
function control_heading(hdg) {
    current_hdg = geofs.animation.values.heading360

        error_hdg = hdg - current_hdg

        if (Math.abs(error_hdg) < 180) {
            tgt_roll = Math.min(turning_roll, 5 * Math.abs(error_hdg)) * Math.sign(error_hdg)
        } else {
            tgt_roll = Math.min(turning_roll, 5 * (360 - Math.abs(error_hdg))) * Math.sign(error_hdg) * -1
        }
        control_roll(tgt_roll)
}
pCI = 0
    pprev_err = 0
    prev_pitch = 0
    // function control_pitch(ask_pitch){
    // pitch = geofs.animation.values.atilt


    // perr = ask_pitch + pitch

    // pCP = pKp * perr
    // pCI += pprev_err * pKi
    // pCD = (pprev_err - perr) * pKd

    // pCI = Math.max(-1, pCI)
    // pCI = Math.min(1, pCI)

    // pprev_err = perr
    // if (geofs.animation.values.groundContact){
    // pCI=0
    // }

    // control_load_factor( 1+pCP + pCI + pCD)

    // }
    pglim = 1
    pCP_smooth = 0
    pKs = 100
    cmd_pitch = 0
function control_pitch(ask_pitch) {

    if (speed > 100) {
        takeoff = geofs.animation.values.groundContact || !AP_Land && (geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet) < 50
            if (takeoff) {
                perr = 10 + pitch // limit pitch on takeoff to avoid tail strike
            } else {
                perr = ask_pitch + pitch
            }

            pCP = pKp * perr
            if (Math.abs(pCP - pCP_smooth) > .01) {
                pCP_smooth += Math.sign(pCP - pCP_smooth) / pKs

            } else {
                pCP_smooth = pCP

            }
            pCP_smooth = Math.max(-1, Math.min(1, pCP_smooth))

            pCI += pprev_err * pKi
            pCD = (pprev_err - perr) * pKd

            pCI = Math.max(-1, pCI)
            pCI = Math.min(1, pCI)

            pprev_err = perr
            if (geofs.animation.values.groundContact) {
                pCI = 0
            }

            if (gload > maxg) {
                pglim *= .95
            } else if (gload < ming) {
                pglim *= .95
            } else {
                if (pglim > .98) {
                    pglim = 1
                } else {
                    pglim /= .95
                }

            }
            minelev = -1
            if (takeoff || AP_Land) {
                minelev = -.20
            }
            cmd_pitch = Math.max(minelev, Math.min(1, pCP_smooth + pCI + pCD))

            current_pitch = controls.rawPitch

            controls.rawPitch = cmd_pitch * pglim

            if (Math.abs(dpitch) > dpitch_limit) {
                controls.rawPitch *= .95
            }

    }

    pp.innerHTML = "PITCH " + Math.round(100 * (cmd_pitch * pglim)) / 100

}
last_checked_freq = 0
    thisnav = ""
function find_ILS() {
    distance = 1e18
        freq = geofs.animation.values.NAV1Frequency

        geofs.nav.frequencies.forEach((nav) => {
            if (nav[0].freq == freq && distance > nav[0].distance) {
                thisnav = nav[0];
                distance = nav[0].distance
                    last_checked_freq = freq

            }
        })
        return thisnav
}
nav = null
    nav_error = 0
    nki = 0.0
    nCI = 0
function control_nav() {
    freq = geofs.animation.values.NAV1Frequency

        obs = geofs.animation.values.NAVOBS

        if (last_checked_freq != freq || nav.ILS) {
            nav = find_ILS()
                if (nav.ILS) {
                    obs = nav.heading
                }
        }
        //brg=geofs.animation.values.NAV1Bearing
        delta = geofs.animation.values.NAVCourseDeviation*geofs.animation.values.NAVDistance
        //delta=brg-obs
        nCI += delta * nki
        nCi = Math.max(-10, Math.min(10, nCI))
        delta = Math.max(-30, Math.min(30, nKp * delta))

        control_heading(delta + obs + nCI)
}

gskp = 20
    gski = .1
    gsCI = 0
    vs100 = 0
function control_gs() {
    gs_dev = geofs.animation.values.NAVGlideAngleDeviation
        gsCI += gs_dev * gski

        gsCI = Math.max(-10, Math.min(10, gsCI))

        gs_pitch = Math.max(-10, Math.min(10, gsCI + gskp * gs_dev))
        vsCI = gs_pitch
        control_pitch(gs_pitch)
        pgs.innerHTML = "GS " + Math.round(100 * (gs_pitch)) / 100
        pl.innerHTML = "LAND " + Math.round(geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet)
        if (geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet < 100 + 9 && speed > 35) {
            vs100 = vspeed

                tgt_vs = -500
                toggle_GS()
                if (AP_Speed) {
                    toggle_SPD()
                }
                toggle_Land()
                console.log("LAND LAND LAND")
        }

}

function control_land() {
    height = geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet
        pl.innerHTML = "LAND " + Math.round(height)
        if (!geofs.animation.values.groundContact && height < 30 + 10) {
            tgt_vs = 0

                controls.throttle = 0
        }
        control_vspeed()
        if (geofs.animation.values.groundContact) {
            if (speed > 40) {

                if (controls.airbrakes.position == 0) {
                    controls.setters.setAirbrakes.set()

                }

                if (controls.throttle > -1) {
                    controls.setters.decreaseThrottle.set()
                }

            } else {
                controls.brakes = 1
                    controls.throttle = 0
                    toggle_Land()
                    toggle_NAV()
                    tgt_roll = 0
            }
        }

}

pitch = 0
    dpitch = 0

function AP_Pitch_roll() {

    var myInterval = setInterval(function () {
        //vspeed = geofs.animation.values.verticalSpeed
        //
        gload = geofs.animation.values.loadFactor
            //vspeed_kt=vspeed/6076.12*60
            //Gnd_speed = geofs.animation.values.groundSpeedKnt
            //speed_vector=Math.sqrt(vspeed_kt**2+Gnd_speed**2)
            //pitch = geofs.animation.values.atilt
            //altitude = geofs.animation.values.altitude
            //roll_angle = geofs.animation.values.aroll
            pitch = geofs.animation.values.atilt
            dpitch = pitch - prev_pitch
            pg.innerHTML = "G " + Math.round(100 * (gload)) / 100
            tgt_alt = geofs.autopilot.values.altitude
            tgt_spd = geofs.autopilot.values.speed
            //tgt_vs=geofs.autopilot.values.verticalSpeed
            tgt_hdg = geofs.autopilot.values.course
            //
            vspeed = geofs.animation.values.verticalSpeed
            vspeed_kt = vspeed / 6076.12 * 60
            Gnd_speed = geofs.animation.values.groundSpeedKnt
            rel_wind_speed = geofs.animation.values.windSpeed * Math.cos(geofs.animation.values.relativeWind * DEGREES_TO_RAD)
            speed = Math.sqrt(vspeed_kt ** 2 + (Gnd_speed - rel_wind_speed) ** 2)

            if (AP_G) {
                control_load_factor(tgt_g)
            }

            //////////// SPEED ////////////

            if (AP_Speed) {

                control_speed(tgt_spd)

            }

            //////////PITCH ///////////////

            if (AP_Pitch) {
                control_pitch(tgt_pitch)

            }

            /////////////////////// VERTICAL SPEED

            if (AP_Vspeed) {

                control_vspeed()

            }

            /////////////// ALTITUDE

            if (AP_Altitude) {

                control_altitude(tgt_alt)

            }

            //////////HEADING ///////////////

            if (AP_Roll) {

                control_roll(tgt_roll)

            }

            //////////HEADING ///////////////

            if (AP_HDG) {

                control_heading(tgt_hdg)

            }

            if (AP_NAV) {

                control_nav()

            }

            if (AP_GS) {

                control_gs()

            }

            if (AP_Land) {
                control_land()
            }

            prev_pitch = pitch

            if (AP_is_ON == false) {
                clearInterval(myInterval);
                console.log('AP IS OFF')
                pap.style.background = "";

            }

    }, 100);

    //controls.rawPitch
    //geofs.animation.values.atilt


}

var pap = document.createElement("p");
var pg = document.createElement("p");
var pp = document.createElement("p");
var palt = document.createElement("p");
var pvs = document.createElement("p");
var pcl = document.createElement("p");
var pspd = document.createElement("p");
var prol = document.createElement("p");
var phdg = document.createElement("p");
var pnav = document.createElement("p");
var pgs = document.createElement("p");
var pl = document.createElement("p");

pap.innerHTML = "AP";
pg.innerHTML = "G";
pp.innerHTML = "PITCH";
palt.innerHTML = "ALT";
pvs.innerHTML = "VS";
pcl.innerHTML = "CLIMB";
prol.innerHTML = "ROLL";
phdg.innerHTML = "HDG";
pnav.innerHTML = "NAV";
pgs.innerHTML = "GS";
pl.innerHTML = "LAND";
pspd.innerHTML = "SPEED";

var div = document.createElement("div");
div.style.width = "50px";
div.style.height = "50px";
div.style.background = "red";
div.style.color = "white";
//div.style.position = "absolute";
div.style.top = "50px";

document.body.appendChild(div);

div.appendChild(pap);
div.appendChild(pg);
div.appendChild(pp);
div.appendChild(palt);
div.appendChild(pvs);
div.appendChild(pcl);
div.appendChild(pspd);
div.appendChild(prol);
div.appendChild(phdg);
div.appendChild(pnav);
div.appendChild(pgs);
div.appendChild(pl);

pap.onmousedown = toggle_AP
    pg.onmousedown = toggle_G
    pp.onmousedown = toggle_Pitch
    palt.onmousedown = toggle_Altitude
    pvs.onmousedown = toggle_VS
    pcl.onmousedown = toggle_Climb
    prol.onmousedown = toggle_Roll
    phdg.onmousedown = toggle_HDG
    pnav.onmousedown = toggle_NAV
    pgs.onmousedown = toggle_GS
    pspd.onmousedown = toggle_SPD

function toggle_AP() {
    if (AP_is_ON) {
        AP_is_ON = 0
            div.style.background = "";
        apctl.style.display = ""

    } else {
        div.style.background = "green";
        AP_is_ON = 1
            AP_Pitch_roll();
        apctl.style.display = "BLOCK"

    }
}

function toggle_G() {
    if (AP_G) {
        AP_G = 0
            pg.style.background = "";
    } else {
        pg.style.background = "green";
        pp.style.background = "";
        pvs.style.background = "";
        AP_G = true;
        AP_Pitch = false;
        AP_Vspeed = false;
    }
}

function toggle_Pitch() {
    if (AP_Pitch) {
        AP_Pitch = 0
            pp.style.background = "";
    } else {
        pp.style.background = "green";
        pg.style.background = "";
        pvs.style.background = "";
        AP_G = false;
        AP_Pitch = true;
        AP_Vspeed = false;
    }
}

function toggle_Altitude() {

    if (AP_Altitude) {
        AP_Altitude = 0
            palt.style.background = "";
        pvs.style.background = "";
        pcl.style.background = "";
        AP_Vspeed = 0
            AP_Climb = 0

    } else {
        palt.style.background = "green";
        pg.style.background = "";
        pp.style.background = "";
        pl.style.background = "";

        AP_G = 0
            AP_Land = 0
            AP_Pitch = 0
            AP_Altitude = true;
    }
}
function toggle_VS() {
    if (AP_Vspeed) {
        AP_Vspeed = 0

            pvs.style.background = "";
    } else {

        vsCI = -pitch
            pvs.style.background = "green";
        pcl.style.background = "";
        pg.style.background = "";
        pp.style.background = "";

        AP_Vspeed = true;
        AP_Climb = false;
        AP_Pitch = 0;
        AP_G = 0
    }
}
function toggle_Climb() {
    if (AP_Climb) {
        AP_Climb = 0

            pcl.style.background = "";
    } else {

        cCI = controls.pitch
            pcl.style.background = "green";
        pvs.style.background = "";

        AP_Vspeed = false;
        AP_Climb = true;
    }
}
function toggle_Roll() {
    if (AP_Roll) {
        AP_Roll = 0

            prol.style.background = "";
    } else {
        prol.style.background = "green";
        phdg.style.background = "";

        AP_HDG = false;
        AP_Roll = true;
    }

}
function toggle_HDG() {
    if (AP_HDG) {
        AP_HDG = 0

            phdg.style.background = "";
    } else {
        phdg.style.background = "green";
        prol.style.background = "";
        pnav.style.background = "";

        AP_HDG = true;
        AP_NAV = false;
        AP_Roll = false;
    }

}
function toggle_NAV() {
    if (AP_NAV) {
        AP_NAV = 0

            pnav.style.background = "";
    } else {
        pnav.style.background = "green";
        phdg.style.background = "";
        prol.style.background = "";

        AP_NAV = true;
        AP_HDG = false;
        AP_Roll = false;
    }

}
function toggle_GS() {
    if (AP_GS) {
        AP_GS = 0

            pgs.style.background = "";
    } else {
        pgs.style.background = "green";
        pvs.style.background = "";
        palt.style.background = "";

        AP_GS = true;
        AP_Altitude = false
            AP_Vspeed = false;

    }

}

function toggle_SPD() {
    if (AP_Speed) {
        AP_Speed = 0

            pspd.style.background = "";
    } else {
        pspd.style.background = "green";

        AP_Speed = true;
    }

}

function toggle_Land() {
    if (AP_Land) {
        AP_Land = 0

            pl.style.background = "";
    } else {
        pl.style.background = "green";

        AP_Land = true;
    }

}

pub = document.getElementsByClassName("geofs-adbanner")
    pub[0].style.display = "none"
    apctl = document.getElementsByClassName("geofs-autopilot-controls")[0]
    apctl.style.display = "block"
